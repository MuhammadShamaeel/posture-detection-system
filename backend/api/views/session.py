import joblib
import numpy as np
import os
from pathlib import Path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from db.models.session import Session
from api.serializers.session_serializer import SessionSerializer

# ─── ML MODEL LOADING ────────────────────────────────────────────────────────
# Get the base directory (where manage.py is)
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Paths to model files
MODEL_PATH = BASE_DIR / 'models' / 'best_posture_model.pkl'
SCALER_PATH = BASE_DIR / 'models' / 'scaler.pkl'
FEATURES_PATH = BASE_DIR / 'models' / 'feature_columns.pkl'
ENCODER_PATH = BASE_DIR / 'models' / 'label_encoder.pkl'

# Global variables for loaded models
_model = None
_scaler = None
_feature_columns = None
_label_encoder = None

def load_ml_model():
    """Lazy load the ML model and related files"""
    global _model, _scaler, _feature_columns, _label_encoder
    
    print(f"🔍 Looking for model at: {MODEL_PATH}")
    
    if _model is None:
        try:
            if MODEL_PATH.exists():
                _model = joblib.load(MODEL_PATH)
                print(f"✅ ML Model loaded from {MODEL_PATH}")
                print(f"   Model type: {type(_model).__name__}")
            else:
                print(f"⚠️ Model not found at {MODEL_PATH}")
                _model = None
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            _model = None
    
    if _scaler is None and SCALER_PATH.exists():
        try:
            _scaler = joblib.load(SCALER_PATH)
            print(f"✅ Scaler loaded from {SCALER_PATH}")
        except Exception as e:
            print(f"❌ Error loading scaler: {e}")
    
    if _feature_columns is None and FEATURES_PATH.exists():
        try:
            _feature_columns = joblib.load(FEATURES_PATH)
            print(f"✅ Feature columns loaded: {len(_feature_columns)} features")
            print(f"   Features: {_feature_columns[:5]}...")
        except Exception as e:
            print(f"❌ Error loading feature columns: {e}")
    
    if _label_encoder is None and ENCODER_PATH.exists():
        try:
            _label_encoder = joblib.load(ENCODER_PATH)
            print(f"✅ Label encoder loaded")
        except Exception as e:
            print(f"❌ Error loading label encoder: {e}")
    
    return _model, _scaler, _feature_columns, _label_encoder


# ─── POSTURE PREDICTION ENDPOINT ─────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def predict_posture(request):
    """
    Predict posture from angle features using trained ML model
    Expected request body:
    {
        "features": {
            "Age": 25,
            "Knee_Angle": 120,
            "Elbow_Angle": 90,
            ...
        }
    }
    """
    try:
        # Load ML model
        model, scaler, feature_columns, label_encoder = load_ml_model()
        
        if model is None:
            return Response({
                "error": "ML model not loaded. Please ensure model files exist in backend/models/",
                "status": "error"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Get features from request
        features_dict = request.data.get('features', {})
        
        if not features_dict:
            return Response({
                "error": "No features provided. Expected 'features' object in request body.",
                "status": "error"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create feature array in correct order
        if feature_columns:
            feature_values = []
            missing_features = []
            
            for col in feature_columns:
                if col in features_dict:
                    feature_values.append(float(features_dict[col]))
                else:
                    missing_features.append(col)
                    feature_values.append(0)  # Default value for missing features
            
            if missing_features:
                print(f"⚠️ Missing features: {missing_features}")
        else:
            feature_values = list(features_dict.values())
        
        feature_array = np.array(feature_values).reshape(1, -1)
        
        # Scale features
        if scaler:
            feature_scaled = scaler.transform(feature_array)
        else:
            feature_scaled = feature_array
        
        # Predict
        prediction = int(model.predict(feature_scaled)[0])
        probability = model.predict_proba(feature_scaled)[0].tolist()
        
        # Convert prediction to label
        if label_encoder:
            posture_label = label_encoder.inverse_transform([prediction])[0]
        else:
            posture_label = "Good Posture" if prediction == 0 else "Bad Posture"
        
        # Determine zone based on probability and prediction
        if prediction == 0:  # Good posture
            zone = "GREEN"
            confidence_good = probability[0]
            confidence_bad = probability[1]
        else:  # Bad posture
            confidence_bad = probability[1] if len(probability) > 1 else probability[0]
            confidence_good = probability[0] if len(probability) > 1 else 1 - probability[0]
            
            # If confidence is very high, it's RED, else YELLOW
            zone = "RED" if confidence_bad > 0.7 else "YELLOW"
        
        return Response({
            "posture": posture_label,
            "zone": zone,
            "prediction": prediction,
            "confidence": {
                "good": round(confidence_good, 4),
                "bad": round(confidence_bad, 4)
            },
            "status": "success"
        })
        
    except Exception as e:
        print(f"❌ Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return Response({
            "error": str(e),
            "status": "error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── BATCH PREDICTION ENDPOINT ────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def batch_predict_posture(request):
    """
    Predict posture for multiple frames at once
    Expected request body:
    {
        "frames": [
            {"features": {...}},
            {"features": {...}},
            ...
        ]
    }
    """
    try:
        model, scaler, feature_columns, label_encoder = load_ml_model()
        
        if model is None:
            return Response({
                "error": "ML model not loaded"
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        frames = request.data.get('frames', [])
        
        if not frames:
            return Response({
                "error": "No frames provided"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        predictions = []
        
        for frame in frames:
            features_dict = frame.get('features', {})
            
            if feature_columns:
                feature_values = [float(features_dict.get(col, 0)) for col in feature_columns]
            else:
                feature_values = list(features_dict.values())
            
            feature_array = np.array(feature_values).reshape(1, -1)
            
            if scaler:
                feature_scaled = scaler.transform(feature_array)
            else:
                feature_scaled = feature_array
            
            prediction = int(model.predict(feature_scaled)[0])
            probability = model.predict_proba(feature_scaled)[0].tolist()
            
            predictions.append({
                "prediction": prediction,
                "confidence": round(max(probability), 4),
                "is_good": prediction == 0
            })
        
        # Calculate summary statistics
        good_count = sum(1 for p in predictions if p['is_good'])
        bad_count = len(predictions) - good_count
        
        return Response({
            "predictions": predictions,
            "summary": {
                "total_frames": len(predictions),
                "good_posture_frames": good_count,
                "bad_posture_frames": bad_count,
                "good_percentage": round(good_count / len(predictions) * 100, 2) if predictions else 0
            },
            "status": "success"
        })
        
    except Exception as e:
        print(f"❌ Batch prediction error: {e}")
        return Response({
            "error": str(e),
            "status": "error"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── HEALTH CHECK ENDPOINT ───────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def model_health(request):
    """Check if ML model is loaded and ready"""
    model, scaler, feature_columns, label_encoder = load_ml_model()
    
    return Response({
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "features_loaded": feature_columns is not None,
        "encoder_loaded": label_encoder is not None,
        "n_features": len(feature_columns) if feature_columns else 0,
        "features": feature_columns if feature_columns else [],
        "status": "ready" if model else "not_ready"
    })


# ─── EXISTING SESSION ENDPOINTS ──────────────────────────────────────────────

# Create session
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_session(request):
    data = request.data.copy()
    data["user"] = request.user.id

    serializer = SessionSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data)

    return Response(serializer.errors, status=400)


# Get all sessions
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_sessions(request):
    sessions = Session.objects.filter(user=request.user).order_by("-started_at")
    serializer = SessionSerializer(sessions, many=True)
    return Response(serializer.data)


# Delete session
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    try:
        session = Session.objects.get(id=session_id, user=request.user)
        session.delete()
        return Response({"message": "Deleted"})
    except Session.DoesNotExist:
        return Response({"error": "Not found"}, status=404)


# Clear all sessions
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def clear_sessions(request):
    Session.objects.filter(user=request.user).delete()
    return Response({"message": "All sessions cleared"})