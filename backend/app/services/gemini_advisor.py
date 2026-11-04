"""
Gemini AI Laboratory Safety Advisor & SDS Intelligence Service
Integrates Google Gemini to deliver real-time chemical safety answers,
emergency spill protocols, personal protective equipment (PPE) recommendations,
and lab equipment SOP guidance.
"""

import os
import json
import urllib.request
import urllib.error
from app.config import Config

class GeminiAdvisor:

    @classmethod
    def get_api_key(cls):
        return Config.GEMINI_API_KEY or os.getenv('GEMINI_API_KEY', '')

    @classmethod
    def ask_safety_assistant(cls, prompt: str, chemical_context: dict = None, asset_context: dict = None):
        """
        Query Gemini API for lab safety recommendations, SOP protocols, or emergency advice.
        """
        api_key = cls.get_api_key()
        
        system_instruction = (
            "You are the Intelligent Laboratory Safety & Chemical Compliance AI Assistant for PES University. "
            "You provide accurate, safety-critical advice on chemical hazards, GHS pictograms, NFPA 704 fire diamonds, "
            "SDS sheets, incompatible reagent storage, spill containment, personal protective equipment (PPE), "
            "and laboratory instrument calibration/troubleshooting. "
            "Format your answers with clear markdown headings, bullet points, and warning callouts where appropriate. "
            "Always prioritize human life, ventilation, and proper emergency procedures."
        )

        context_str = ""
        if chemical_context:
            context_str += f"\n[Chemical Context: Name: {chemical_context.get('name')}, CAS: {chemical_context.get('cas_number')}, Formula: {chemical_context.get('formula')}, Hazard: {chemical_context.get('hazard_class_name')}, NFPA: Health {chemical_context.get('nfpa', {}).get('health')}, Flam {chemical_context.get('nfpa', {}).get('flammability')}]\n"
        if asset_context:
            context_str += f"\n[Asset Context: Equipment: {asset_context.get('name')}, Tag: {asset_context.get('asset_tag')}, Category: {asset_context.get('category')}, Status: {asset_context.get('status')}]\n"

        full_prompt = f"{system_instruction}\n\nContext:{context_str}\nUser Question: {prompt}\n\nPlease provide a structured, practical, and compliant safety guidance response:"

        if api_key:
            try:
                # Call Gemini API via standard REST endpoint
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": full_prompt}]
                    }]
                }
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode('utf-8'),
                    headers={'Content-Type': 'application/json'}
                )
                with urllib.request.urlopen(req, timeout=12) as response:
                    res_data = json.loads(response.read().decode('utf-8'))
                    text = res_data['candidates'][0]['content']['parts'][0]['text']
                    return {
                        'success': True,
                        'source': 'Gemini 2.5 Flash',
                        'reply': text
                    }
            except Exception as e:
                # Fall through to deterministic expert engine if network/key issues
                print(f"[GeminiAdvisor] API call notice: {e}. Using expert laboratory rules.")

        # Expert fallback knowledge engine for offline demonstrations
        p_lower = prompt.lower()
        if 'spill' in p_lower:
            reply = (
                "### 🚨 Immediate Chemical Spill Emergency Protocol\n\n"
                "1. **Evacuate & Isolate**: Alert all laboratory personnel immediately. Pull eyewash/safety shower station if dermal contact occurred.\n"
                "2. **Identify the Reagent**: Check the container QR code or SDS sheet. Determine whether it is an inorganic acid, strong base, or flammable solvent.\n"
                "3. **Ventilation**: Ensure fume hoods are on maximum draw. Open auxiliary emergency dampers if present.\n"
                "4. **Neutralization & Absorption**:\n"
                "   - *Acids*: Apply sodium bicarbonate (baking soda) or calcium carbonate slowly from the perimeter inward until fizzing stops.\n"
                "   - *Bases*: Apply dilute citric acid or boric acid absorbent pads.\n"
                "   - *Flammable Solvents*: Use vermiculite or activated carbon pillows. Eliminate any potential ignition sources or open flames.\n"
                "5. **Disposal**: Sweep contaminated absorbent into heavy-gauge polyethylene hazardous waste bags, label with hazard manifest, and transfer to designated Waste Accumulation Area."
            )
        elif 'ppe' in p_lower or 'gear' in p_lower or 'protect' in p_lower:
            reply = (
                "### 🥽 Required Personal Protective Equipment (PPE)\n\n"
                "- **Eye & Face**: ANSI Z87.1 certified chemical splash goggles. Face shield required when dispensing boiling liquids or fuming acids.\n"
                "- **Gloves**:\n"
                "  - *Nitrile Gloves (4-8 mil)*: Standard protection for general salts, ethanol, and aqueous buffers.\n"
                "  - *Neoprene / Butyl Rubber*: Mandatory when handling halogenated solvents, concentrated nitric acid, or caustics.\n"
                "- **Body Protection**: 100% Cotton lab coat with snap buttons (non-synthetic to prevent static melting). Full-length pants and closed-toe leather laboratory shoes.\n"
                "- **Respiratory**: Work within certified fume hood (face velocity 80-120 FPM). Use NIOSH half-face respirator with multi-gas/organic vapor cartridge if handling volatiles outside containment."
            )
        elif 'incompatible' in p_lower or 'mix' in p_lower or 'storage' in p_lower:
            reply = (
                "### ⚗️ Laboratory Storage Segregation Rules\n\n"
                "- **Acids vs Bases**: Store mineral acids (HCl, H2SO4) strictly separated from hydroxide bases (NaOH, KOH) to prevent explosive exothermic neutralization.\n"
                "- **Oxidizers vs Flammables**: Never co-locate Nitric acid, Hydrogen peroxide, or Permanganates with Acetone, Ethanol, or Ethers.\n"
                "- **Cyanides**: Always keep NaCN and KCN locked in dedicated poison cabinets away from any acid vapors (which liberate lethal HCN gas)."
            )
        else:
            reply = (
                "### 🧪 Intelligent Laboratory Compliance Guidance\n\n"
                f"Regarding your query on: **{prompt}**\n\n"
                "- **Standard Operating Procedure**: Always review the official GHS Safety Data Sheet (SDS) Section 4 (First Aid), Section 7 (Handling & Storage), and Section 8 (Exposure Controls).\n"
                "- **Check-in/Check-out Discipline**: Scan the item's QR barcode before and after use to maintain exact real-time volumetric balances and audit logs.\n"
                "- **Safety Warning**: Verify container integrity, cap tight seal, and expiration date before beginning any chemical manipulation."
            )

        return {
            'success': True,
            'source': 'Intelligent Lab Safety Engine',
            'reply': reply
        }
