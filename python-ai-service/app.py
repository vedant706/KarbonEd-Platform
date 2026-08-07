from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import os
from dotenv import load_dotenv

# SECURE: Load the secret variables from the .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# SECURE: Now it pulls from the hidden file instead of plain text!
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
# Make sure to replace 'yourdbname' with your actual database name if you changed it!
db = client['test'] 
credits_collection = db.carboncredits

@app.route('/api/recommend', methods=['POST', 'OPTIONS'])
def recommend():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        data = request.get_json()
        user_footprint = float(data.get('footprint', 0))
        
        price_weight = float(data.get('priceWeight', 0.5))
        capacity_weight = float(data.get('capacityWeight', 0.5))

        # Only fetch projects that have *at least* enough capacity
        projects_cursor = credits_collection.find({
            "isVerified": True,
            "offsetAmount": {"$gte": user_footprint}
        })
        projects = list(projects_cursor)

        if not projects:
            return jsonify({
                "recommendedProject": f"⚠️ No active verified projects found with a capacity large enough to handle your {user_footprint} Ton footprint."
            }), 200

        df = pd.DataFrame(projects)
        
        df['amount_difference'] = abs(df['offsetAmount'] - user_footprint)
        
        scaler = MinMaxScaler()
        
        if len(df) > 1:
            df[['norm_price', 'norm_diff']] = scaler.fit_transform(df[['pricePerTon', 'amount_difference']])
        else:
            df['norm_price'] = 0
            df['norm_diff'] = 0
            
        df['match_score'] = (df['norm_price'] * price_weight) + (df['norm_diff'] * capacity_weight)
        
        best_project = df.loc[df['match_score'].idxmin()]
        
        project_name = best_project['projectName']
        company_name = best_project['companyName']
        price = best_project['pricePerTon']
        available_tons = best_project['offsetAmount']
        
        p_pct = int(price_weight * 100)
        c_pct = int(capacity_weight * 100)
        
        recommendation_text = (
            f"🤖 AI Match: We recommend '{project_name}' by {company_name}. "
            f"Available Capacity: {available_tons} Tons | Price: ₹{price}/Ton. "
            f"Selected based on your custom preferences ({p_pct}% Price / {c_pct}% Capacity) "
            f"for your {user_footprint} Ton footprint."
        )

        return jsonify({"recommendedProject": recommendation_text}), 200

    except Exception as e:
        print(f"Error in recommendation logic: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True, use_reloader=False)