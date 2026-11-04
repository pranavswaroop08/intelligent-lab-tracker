"""
Automated Integration Test Suite for Flask REST API
Tests all core functional modules of Intelligent Laboratory Asset & Chemical Tracking Platform
"""

import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app import create_app
from database.init_db import init_database

def run_tests():
    init_database()
    app = create_app()
    client = app.test_client()

    print("\n" + "=" * 60)
    print("  RUNNING INTELLIGENT LAB TRACKER REST API TEST SUITE")
    print("=" * 60)

    # 1. Health check
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    data = res.get_json()
    assert data['status'] == 'healthy'
    print("[PASS] 1. /api/health - API online & reporting metadata")

    # 2. Auth login
    res = client.post('/api/auth/login', json={'identifier': 'PES2UG24CS365', 'password': 'password123'})
    assert res.status_code == 200, f"Login failed: {res.status_code}"
    user_data = res.get_json()
    assert user_data['user']['name'] == 'Pranav Swaroop S'
    print(f"[PASS] 2. /api/auth/login - Logged in as: {user_data['user']['name']} ({user_data['user']['srn_or_emp_id']})")

    # 3. Chemical catalog
    res = client.get('/api/chemicals')
    assert res.status_code == 200
    chems = res.get_json()
    assert len(chems) >= 8
    print(f"[PASS] 3. /api/chemicals - Fetched {len(chems)} catalog chemicals with GHS/NFPA ratings")

    # 4. Chemical search
    res = client.get('/api/chemicals?q=Acetone')
    assert res.status_code == 200
    res_chems = res.get_json()
    assert len(res_chems) >= 1 and 'Acetone' in res_chems[0]['name']
    print(f"[PASS] 4. /api/chemicals?q=Acetone - Filter matched: {res_chems[0]['name']}")

    # 5. Compatibility Pairwise Check (Nitric acid + Acetone Detonation Alert)
    res = client.post('/api/compatibility/check-pair', json={'chemical_a_id': 1, 'chemical_b_id': 3})
    assert res.status_code == 200
    compat = res.get_json()
    assert compat['compatible'] is False
    assert 'EXPLOSION' in compat['severity']
    print(f"[PASS] 5. /api/compatibility/check-pair - Hazard Alert: {compat['title']} [{compat['severity']}]")

    # 6. Storage Location Safety Audit
    res = client.get('/api/locations/1/safety-audit')
    assert res.status_code == 200
    audit_res = res.get_json()
    print(f"[PASS] 6. /api/locations/1/safety-audit - Cabinet: {audit_res['location_name']}, Total Items: {audit_res['total_batches']}")

    # 7. Asset Catalog & Borrow Flow
    res = client.get('/api/assets')
    assert res.status_code == 200
    assets = res.get_json()
    assert len(assets) >= 6
    print(f"[PASS] 7. /api/assets - Fetched {len(assets)} laboratory assets")

    # Borrow an available asset (Asset 1: UV-Vis Spectro)
    res = client.post('/api/assets/1/borrow', json={
        'user_id': 1,
        'purpose': 'Biomolecular absorption kinetics testing',
        'borrow_duration_hours': 2
    })
    assert res.status_code == 200
    borrow_data = res.get_json()
    assert borrow_data['asset']['status'] == 'in_use'
    print(f"[PASS] 8. /api/assets/1/borrow - Asset status transitioned to: {borrow_data['asset']['status']}")

    # Return asset
    res = client.post('/api/assets/1/return', json={
        'condition_on_return': 'Pristine, lens wiped',
        'runtime_hours': 1.8
    })
    assert res.status_code == 200
    return_data = res.get_json()
    assert return_data['asset']['status'] == 'available'
    print(f"[PASS] 9. /api/assets/1/return - Returned asset status: {return_data['asset']['status']}")

    # 8. Chemical Dispensation & Volumetric Deduction
    batch_res = client.get('/api/chemicals/batches')
    batch_1 = [b for b in batch_res.get_json() if b['id'] == 1][0]
    initial_qty = batch_1['current_quantity']

    res = client.post('/api/dispensations', json={
        'batch_id': 1,
        'user_id': 1,
        'dispensed_amount': 25.0,
        'experiment_name': 'HPLC Column Conditioning'
    })
    assert res.status_code == 201
    disp_data = res.get_json()
    assert disp_data['batch']['current_quantity'] == initial_qty - 25.0
    print(f"[PASS] 10. /api/dispensations - Successfully deducted 25.0 ml (New balance: {disp_data['batch']['current_quantity']} ml)")

    # 9. Calibration Recording
    res = client.post('/api/assets/3/calibrate', json={
        'technician_name': 'Pranav Kaushal J',
        'technician_organization': 'PES Metrology Division',
        'calibration_status': 'passed',
        'measured_deviation': '+0.01 mg'
    })
    assert res.status_code == 201
    cal_data = res.get_json()
    print(f"[PASS] 11. /api/assets/3/calibrate - Micro-balance calibration recorded successfully. Status: {cal_data['asset']['status']}")

    # 10. AI Safety Advisor
    res = client.post('/api/ai/safety-advisor', json={'prompt': 'How should an acid spill be contained?'})
    assert res.status_code == 200
    ai_reply = res.get_json()
    assert 'reply' in ai_reply and len(ai_reply['reply']) > 20
    print(f"[PASS] 12. /api/ai/safety-advisor - Received guidance from: {ai_reply['source']}")

    # 11. Dashboard Analytics Summary
    res = client.get('/api/analytics/dashboard')
    assert res.status_code == 200
    dash = res.get_json()
    assert 'compliance_score' in dash['summary']
    print(f"[PASS] 13. /api/analytics/dashboard - Compliance Score: {dash['summary']['compliance_score']}% (Grade: {dash['summary']['compliance_grade']})")

    print("\n" + "=" * 60)
    print("  ALL 13 API TEST CASES PASSED SUCCESSFULLY (100%)!")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    run_tests()
