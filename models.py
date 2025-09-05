from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

class Farmer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    plots = db.relationship('Plot', backref='farmer', lazy=True)

class Plot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmer.id'), nullable=False)
    area_ha = db.Column(db.Float)
    geometry = db.Column(db.Text)  # GeoJSON or WKT
    measurements = db.relationship('Measurement', backref='plot', lazy=True)

class Measurement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    plot_id = db.Column(db.Integer, db.ForeignKey('plot.id'), nullable=False)
    date = db.Column(db.DateTime)
    sample_point = db.Column(db.String(100))
    species = db.Column(db.String(100))
    dbh_cm = db.Column(db.Float)
    height_m = db.Column(db.Float)
    photo_path = db.Column(db.String(200))
