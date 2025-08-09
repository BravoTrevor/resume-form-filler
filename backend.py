import os
from flask import Flask, request, jsonify
from flask_cors import CORS # To handle requests from the browser extension

# --- Placeholder for your actual URL Context Tool/LLM call ---
# This function represents the new tool you mentioned.
# It takes a URL and returns a structured dictionary.
def analyze_job_url_with_llm(job_url: str) -> dict:
    """
    This is a MOCK function. In a real scenario, this function would:
    1. Make a secure API call to your URL context tool/LLM provider (e.g., OpenAI, Google AI).
    2. Pass the job_url to the API.
    3. Include a carefully crafted prompt asking the model to analyze the content for specific details.
    4. Parse the LLM's response into a structured dictionary.
    """
    print(f"Analyzing URL (mock): {job_url}")

    # Example prompt you might send to the LLM:
    # prompt = f"""
    # Analyze the content of the job listing at the URL: {job_url}.
    # Extract the following information and return it as a JSON object with the specified keys:
    # - "jobTitle": The official job title.
    # - "companyName": The name of the company.
    # - "keyResponsibilities": A list of 3-5 main responsibilities.
    # - "requiredSkills": A list of essential skills, tools, or qualifications explicitly mentioned as required.
    # - "preferredSkills": A list of skills mentioned as "preferred," "a plus," or "nice to have."
    # - "standOutFactors": A summary of what an ideal candidate would demonstrate. Analyze the tone and wording to infer what makes someone stand out (e.g., "proven track record in X," "experience scaling Y," "passion for Z").
    # """

    # This is a MOCK RESPONSE for demonstration purposes.
    # The actual LLM would generate this based on the URL's content.
    mock_analysis = {
        "jobTitle": "Senior Frontend Engineer",
        "companyName": "Innovate Inc.",
        "keyResponsibilities": [
            "Develop and maintain user-facing features using React.js.",
            "Collaborate with product managers and designers to translate requirements into technical solutions.",
            "Optimize applications for maximum speed and scalability.",
            "Write high-quality, reusable, and testable code."
        ],
        "requiredSkills": [
            "5+ years of experience with JavaScript/TypeScript",
            "Deep expertise in React.js and its ecosystem (Redux, Next.js)",
            "Strong understanding of HTML5, CSS3, and responsive design",
            "Experience with RESTful APIs"
        ],
        "preferredSkills": [
            "Experience with GraphQL",
            "Familiarity with CI/CD pipelines (e.g., Jenkins, GitHub Actions)",
            "Knowledge of cloud platforms (AWS, GCP)"
        ],
        "standOutFactors": "The ideal candidate will not only have deep technical skills in React but will also demonstrate strong product sense and leadership by mentoring junior engineers. Experience in a fast-paced startup environment is a key differentiator."
    }
    return mock_analysis

# --- Flask App Setup ---
app = Flask(__name__)
# IMPORTANT: Configure CORS to allow requests from your extension's unique ID
# For development, you can be lenient, but for production, lock this down.
# chrome-extension://<your-extension-id-here>
CORS(app, resources={r"/analyze-job": {"origins": "*"}}) # Use "*" for easy local testing

@app.route('/analyze-job', methods=['POST'])
def handle_analyze_job():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({"error": "URL not provided"}), 400

    job_url = data['url']

    try:
        # Call the placeholder function for the URL context tool
        analysis_result = analyze_job_url_with_llm(job_url)
        return jsonify(analysis_result)
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Failed to analyze the URL"}), 500

if __name__ == '__main__':
    # For local development, run this script: `python backend.py`
    app.run(port=5000, debug=True)