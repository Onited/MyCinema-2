import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from extensions import db, bcrypt

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.url_map.strict_slashes = False
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/users_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'default-secret-key')
    app.config['JWT_EXPIRATION_HOURS'] = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
    
    # Initialize extensions
    CORS(app)
    db.init_app(app)
    bcrypt.init_app(app)
    
    # Register blueprints
    from routes.user_routes import user_bp
    from routes.auth_routes import auth_bp
    
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Health check
    @app.route('/health')
    def health():
        return {'status': 'ok', 'service': 'users-service'}
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 3002))
    app.run(host='0.0.0.0', port=port, debug=True)
