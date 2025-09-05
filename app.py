from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS


import os

app = Flask(__name__)
CORS(app)



# -------------------------
# Database configuration
# -------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(BASE_DIR, 'data', 'mrv.db')
os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# -------------------------
# Database Models
# -------------------------
class Farmer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    plots = db.relationship('Plot', backref='farmer', lazy=True)

class Plot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer.id'), nullable=False)
    area_ha = db.Column(db.Float, nullable=False)
    geometry = db.Column(db.Text)
    measurements = db.relationship('Measurement', backref='plot', lazy=True)

class Measurement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    plot_id = db.Column(db.Integer, db.ForeignKey('plot.id'), nullable=False)
    species = db.Column(db.String(100))
    dbh_cm = db.Column(db.Float)
    height_m = db.Column(db.Float)
    sample_point = db.Column(db.String(50))
    photo_path = db.Column(db.String(255))
    carbon_kg = db.Column(db.Float, default=0.0)  # Store calculated carbon for each measurement

# -------------------------
# Routes
# -------------------------
@app.route('/')
def home():
    return "MRV Agroforestry & Rice Carbon Prototype Running"

@app.route('/ui')
def ui():
    return render_template('index.html')

# -------------------------
# Add Farmer
# -------------------------
@app.route('/api/farmers', methods=['POST'])
def add_farmer():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Missing 'name' in request"}), 400

    existing = Farmer.query.filter_by(name=data['name'], phone=data.get('phone')).first()
    if existing:
        return jsonify({"message": "Farmer already exists", "id": existing.id}), 200

    farmer = Farmer(name=data['name'], phone=data.get('phone'))
    db.session.add(farmer)
    db.session.commit()
    return jsonify({"message": "Farmer added", "id": farmer.id})

# -------------------------
# Add Plot
# -------------------------
@app.route('/api/plots', methods=['POST'])
def add_plot():
    data = request.get_json()
    if not data or 'farmer_id' not in data or 'area_ha' not in data:
        return jsonify({"error": "Missing required fields"}), 400

    farmer = Farmer.query.get(data['farmer_id'])
    if not farmer:
        return jsonify({"error": "Farmer not found"}), 404

    plot = Plot(farmer_id=data['farmer_id'], area_ha=data['area_ha'], geometry=data.get('geometry', "{}"))
    db.session.add(plot)
    db.session.commit()
    return jsonify({"message": "Plot added", "id": plot.id})

# -------------------------
# Add Measurement
# -------------------------
@app.route('/api/measurements', methods=['POST'])
def add_measurement():
    data = request.get_json()
    required_fields = ['plot_id', 'species', 'dbh_cm', 'height_m', 'sample_point']
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required measurement fields"}), 400

    plot = Plot.query.get(data['plot_id'])
    if not plot:
        return jsonify({"error": "Plot not found"}), 404

    # Calculate carbon for this measurement
    biomass = 0.1 * (data['dbh_cm'] ** 2) * data['height_m']
    carbon = biomass * 0.47

    measurement = Measurement(
        plot_id=data['plot_id'],
        species=data['species'],
        dbh_cm=data['dbh_cm'],
        height_m=data['height_m'],
        sample_point=data['sample_point'],
        photo_path=data.get('photo_path', ""),
        carbon_kg=round(carbon, 2)
    )
    db.session.add(measurement)
    db.session.commit()
    return jsonify({"message": "Measurement added", "id": measurement.id, "carbon_kg": measurement.carbon_kg})

# -------------------------
# Calculate Carbon for Plot
# -------------------------
@app.route('/api/calculate_carbon/<int:plot_id>', methods=['GET'])
def calculate_carbon(plot_id):
    plot = Plot.query.get(plot_id)
    if not plot:
        return jsonify({"error": "Plot not found"}), 404

    measurements = Measurement.query.filter_by(plot_id=plot_id).all()
    if not measurements:
        return jsonify({"error": "No measurements found for this plot"}), 404

    total_biomass = sum(0.1 * (m.dbh_cm ** 2) * m.height_m for m in measurements)
    total_carbon = total_biomass * 0.47

    return jsonify({
        "plot_id": plot_id,
        "plot_area_ha": plot.area_ha,
        "total_biomass_kg": round(total_biomass, 2),
        "total_carbon_kg": round(total_carbon, 2)
    })

# -------------------------
# Dashboard
# -------------------------
@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    farmers = Farmer.query.all()
    result = []

    for farmer in farmers:
        plots = Plot.query.filter_by(farmer_id=farmer.id).all()
        farmer_data = {
            "id": farmer.id,
            "name": farmer.name,
            "plots": []
        }

        for plot in plots:
            measurements = Measurement.query.filter_by(plot_id=plot.id).all()

            total_biomass = sum(0.1 * (m.dbh_cm ** 2) * m.height_m for m in measurements)
            total_carbon = total_biomass * 0.47

            plot_data = {
                "id": plot.id,
                "area_ha": plot.area_ha,
                "total_carbon": round(total_carbon, 2)
            }
            farmer_data["plots"].append(plot_data)

        result.append(farmer_data)

    return jsonify(result)


# -------------------------
# Run App
# -------------------------
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get("PORT", 5000))  # Use Render's assigned port, default to 5000 locally
    app.run(host="0.0.0.0", port=port)





