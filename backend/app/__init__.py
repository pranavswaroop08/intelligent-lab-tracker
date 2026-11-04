from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.models import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Set dynamic database URI
    db_uri = config_class.get_sqlalchemy_database_uri()
    app.config['SQLALCHEMY_DATABASE_URI'] = db_uri
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Enable CORS for React frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize SQLAlchemy
    db.init_app(app)

    # Register Route Blueprints
    from app.routes.auth import auth_bp
    from app.routes.chemicals import chemicals_bp
    from app.routes.assets import assets_bp
    from app.routes.locations import locations_bp
    from app.routes.compatibility import compatibility_bp
    from app.routes.dispensations import dispensations_bp
    from app.routes.maintenance import maintenance_bp
    from app.routes.analytics import analytics_bp
    from app.routes.ai_assistant import ai_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(chemicals_bp)
    app.register_blueprint(assets_bp)
    app.register_blueprint(locations_bp)
    app.register_blueprint(compatibility_bp)
    app.register_blueprint(dispensations_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_bp)

    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'platform': 'Intelligent Laboratory Asset & Chemical Tracking Platform',
            'university': 'PES University',
            'developers': [
                {'srn': 'PES2UG24CS365', 'name': 'Pranav Swaroop S'},
                {'srn': 'PES2UG24CS363', 'name': 'Pranav Kaushal J'}
            ],
            'database_uri_type': 'MySQL' if 'mysql' in db_uri else 'SQLite'
        })

    return app
