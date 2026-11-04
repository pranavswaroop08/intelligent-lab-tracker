"""
Intelligent Chemical Incompatibility & Co-Location Storage Engine
Provides deterministic hazard analysis based on GHS classification, NFPA 704 ratings,
and established laboratory chemical segregation rules (OSHA / EPA Chemical Incompatibility Matrix).
"""

from app.models import db, Chemical, ChemicalBatch, ChemicalIncompatibility, StorageLocation, HazardClass

class CompatibilityEngine:

    # Fallback rule matrix for rapid pairwise checking
    RULE_DEFINITIONS = [
        {
            'codes': ('FLAM_LIQ', 'OXIDIZER'),
            'severity': 'EXPLOSION_HAZARD',
            'title': 'Spontaneous Combustion & Explosion Risk',
            'reason': 'Strong oxidizers (e.g., Nitric Acid, Permanganates, Peroxides) accelerate combustion of flammable organic solvents (e.g., Acetone, Ethanol, Diethyl Ether). Friction or mild warmth can trigger rapid detonation.',
            'safety_protocol': 'Segregate by minimum 6 meters or store in separate dedicated FM-approved safety cabinets.'
        },
        {
            'codes': ('CORR_ACID', 'CORR_BASE'),
            'severity': 'VIOLENT_EXOTHERMIC',
            'title': 'Violent Neutralization & Splattering',
            'reason': 'Concentrated inorganic acids mixed with caustics release tremendous enthalpy of neutralization, causing instant boiling, aerosolization, and toxic acid mist spatter.',
            'safety_protocol': 'Store mineral acids and bases in completely separate cabinets with dedicated containment trays.'
        },
        {
            'codes': ('CORR_ACID', 'TOXIC'),
            'severity': 'TOXIC_GAS_RELEASE',
            'title': 'Lethal Toxic Gas Evolution (HCN / H2S)',
            'reason': 'Inorganic mineral acids reacting with cyanides, sulfides, or azides liberate lethal Hydrogen Cyanide (HCN) or Hydrogen Sulfide (H2S) asphyxiant gases.',
            'safety_protocol': 'Mandatory secondary containment in individually locked poison lockers. Never store near acids or acid drains.'
        },
        {
            'codes': ('FLAM_LIQ', 'CORR_ACID'),
            'severity': 'FIRE_HAZARD',
            'title': 'Corrosive Oxidation & Vapor Ignition',
            'reason': 'Oxidizing acids (e.g., concentrated HNO3 or H2SO4) react vigorously with volatile organic solvents, generating dense heat, nitrosyl vapors, and flammable gas ignition.',
            'safety_protocol': 'Store organic solvents strictly in Flammables Cabinet; store mineral acids in polypropylene acid cabinets.'
        },
        {
            'codes': ('WATER_REACT', 'CORR_ACID'),
            'severity': 'EXPLOSION_HAZARD',
            'title': 'Hydrogen Gas & Pressure Rupture',
            'reason': 'Water-reactive reagents (e.g., alkali metals, hydrides) react violently with moisture and acid solutions, generating pure flammable hydrogen gas.',
            'safety_protocol': 'Store in inert desiccated cabinets under argon/mineral oil.'
        }
    ]

    @classmethod
    def check_pairwise(cls, chem_a: Chemical, chem_b: Chemical):
        """
        Check if two chemicals are incompatible.
        Returns a dict with compatibility status, severity, reasons, and recommendations.
        """
        if chem_a.id == chem_b.id:
            return {
                'compatible': True,
                'severity': 'SAFE',
                'message': 'Same chemical compound. No incompatibility detected.'
            }

        code_a = chem_a.hazard_class.code if chem_a.hazard_class else 'NONE'
        code_b = chem_b.hazard_class.code if chem_b.hazard_class else 'NONE'

        # Specific chemical overrides
        # Nitric Acid (CAS 7697-37-2) + Acetone (CAS 67-64-1) / Ethanol (CAS 64-17-5)
        if ('7697-37-2' in (chem_a.cas_number, chem_b.cas_number) and 
            any(c in (chem_a.cas_number, chem_b.cas_number) for c in ['67-64-1', '64-17-5', '60-29-7'])):
            return {
                'compatible': False,
                'severity': 'CRITICAL_EXPLOSION',
                'title': 'EXTREME DANGER: Nitric Acid + Organic Solvent Detonation Hazard',
                'reason': f'{chem_a.name} and {chem_b.name} form unstable nitro-organic compounds and generate runaway exothermic oxidation, frequently causing laboratory explosions and glass shrapnel.',
                'safety_protocol': 'Strictly forbidden to store together! Must be separated into distinct rooms or dedicated fire/acid cabinets.',
                'nfpa_comparison': {
                    'chem_a': {'name': chem_a.name, 'flammability': chem_a.nfpa_flammability, 'instability': chem_a.nfpa_instability},
                    'chem_b': {'name': chem_b.name, 'flammability': chem_b.nfpa_flammability, 'instability': chem_b.nfpa_instability}
                }
            }

        # Check DB rules first
        if chem_a.hazard_class_id and chem_b.hazard_class_id:
            rule = ChemicalIncompatibility.query.filter(
                ((ChemicalIncompatibility.hazard_class_a_id == chem_a.hazard_class_id) & (ChemicalIncompatibility.hazard_class_b_id == chem_b.hazard_class_id)) |
                ((ChemicalIncompatibility.hazard_class_a_id == chem_b.hazard_class_id) & (ChemicalIncompatibility.hazard_class_b_id == chem_a.hazard_class_id))
            ).first()

            if rule:
                return {
                    'compatible': False,
                    'severity': rule.severity,
                    'title': f'Incompatible Hazard Classes: {chem_a.hazard_class.name} + {chem_b.hazard_class.name}',
                    'reason': rule.reason,
                    'safety_protocol': rule.safety_protocol,
                    'nfpa_comparison': {
                        'chem_a': {'name': chem_a.name, 'health': chem_a.nfpa_health, 'flammability': chem_a.nfpa_flammability},
                        'chem_b': {'name': chem_b.name, 'health': chem_b.nfpa_health, 'flammability': chem_b.nfpa_flammability}
                    }
                }

        # Check hardcoded fallback rules
        for r in cls.RULE_DEFINITIONS:
            rule_codes = r['codes']
            if (code_a == rule_codes[0] and code_b == rule_codes[1]) or (code_a == rule_codes[1] and code_b == rule_codes[0]):
                return {
                    'compatible': False,
                    'severity': r['severity'],
                    'title': r['title'],
                    'reason': r['reason'],
                    'safety_protocol': r['safety_protocol'],
                    'nfpa_comparison': {
                        'chem_a': {'name': chem_a.name, 'health': chem_a.nfpa_health, 'flammability': chem_a.nfpa_flammability},
                        'chem_b': {'name': chem_b.name, 'health': chem_b.nfpa_health, 'flammability': chem_b.nfpa_flammability}
                    }
                }

        # If both are safe together
        return {
            'compatible': True,
            'severity': 'SAFE',
            'title': 'Chemically Compatible',
            'reason': f'No known hazardous co-location reaction identified between {chem_a.name} ({code_a}) and {chem_b.name} ({code_b}).',
            'safety_protocol': 'Maintain standard Good Laboratory Practices (GLP), clean spills, and seal lids tightly.'
        }

    @classmethod
    def audit_location_storage(cls, location_id: int):
        """
        Audit an entire cabinet or room storage location for internal chemical incompatibilities.
        """
        location = StorageLocation.query.get(location_id)
        if not location:
            return {'error': 'Location not found'}

        batches = ChemicalBatch.query.filter_by(location_id=location_id).all()
        chemicals_in_loc = {}
        for b in batches:
            if b.status != 'depleted' and b.chemical:
                chemicals_in_loc[b.chemical.id] = b.chemical

        chem_list = list(chemicals_in_loc.values())
        warnings = []
        is_safe = True

        for i in range(len(chem_list)):
            for j in range(i + 1, len(chem_list)):
                chem_a = chem_list[i]
                chem_b = chem_list[j]
                result = cls.check_pairwise(chem_a, chem_b)
                if not result.get('compatible', True):
                    is_safe = False
                    warnings.append({
                        'chem_a': chem_a.to_dict(),
                        'chem_b': chem_b.to_dict(),
                        'severity': result['severity'],
                        'title': result['title'],
                        'reason': result['reason'],
                        'safety_protocol': result['safety_protocol']
                    })

        # Storage type vs chemical suitability
        cabinet_violations = []
        for chem in chem_list:
            if location.storage_type == 'flammable_cabinet' and chem.hazard_class and chem.hazard_class.code in ('CORR_ACID', 'OXIDIZER'):
                cabinet_violations.append({
                    'chemical': chem.name,
                    'issue': f'Corrosive/Oxidizer chemical "{chem.name}" placed in Flammable Storage Cabinet "{location.name}".'
                })
            elif location.storage_type == 'acid_cabinet' and chem.hazard_class and chem.hazard_class.code == 'FLAM_LIQ':
                cabinet_violations.append({
                    'chemical': chem.name,
                    'issue': f'Flammable liquid "{chem.name}" stored in Acid Storage Cabinet "{location.name}". Risk of fire upon vapor ignition.'
                })

        return {
            'location_id': location.id,
            'location_name': location.name,
            'location_code': location.location_code,
            'storage_type': location.storage_type,
            'total_chemicals': len(chem_list),
            'total_batches': len(batches),
            'is_safe': is_safe and len(cabinet_violations) == 0,
            'incompatibilities_found': len(warnings),
            'warnings': warnings,
            'cabinet_violations': cabinet_violations
        }
