from flask import Blueprint, request, jsonify
from app.services.gemini_advisor import GeminiAdvisor
from app.models import Chemical, Asset

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

@ai_bp.route('/safety-advisor', methods=['POST'])
def safety_advisor():
    data = request.get_json() or {}
    prompt = data.get('prompt', '').strip()

    if not prompt:
        return jsonify({'error': 'prompt is required'}), 400

    chemical_context = None
    if data.get('chemical_id'):
        chem = Chemical.query.get(data['chemical_id'])
        if chem:
            chemical_context = chem.to_dict()

    asset_context = None
    if data.get('asset_id'):
        asset = Asset.query.get(data['asset_id'])
        if asset:
            asset_context = asset.to_dict()

    result = GeminiAdvisor.ask_safety_assistant(prompt, chemical_context, asset_context)
    return jsonify(result)
