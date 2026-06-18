const {GoogleGenerativeAI} = require("@google/generative-ai");

// Initialize the Gemini client with your API key
const genAI = new GoogleGenerativeAI("AQ.Ab8RN6Ikd0e4jjamYNNvMdzjg8MpVynWFllASimhKv0WP6RtcA");

async function analyzeCode(code, language = "javascript") {
    // Get the specific Gemini model we want to use
    // gemini-2.5-flash is fast and free-tier friendly
    const model = genAI.getGenerativeModel({model: "gemini-2.5-flash"});

    // This is called "prompt engineering" — we're not just asking Gemini to
    // "review my code". We're giving it a strict output format (JSON) so we
    // get predictable, structured data we can store in MongoDB.
    const prompt = `
You are an expert code reviewer. Analyze the following ${language} code.
Return ONLY a valid JSON object, no markdown, no extra text.

CODE:
\`\`\`${language}
${code}
\`\`\`

Return exactly this structure:
{
  "summary": "2-3 sentence overview of the code quality",
  "bugs": [{ "line": 0, "issue": "bug description", "fix": "how to fix" }],
  "security": [{ "issue": "security problem", "explanation": "why dangerous and how to fix" }],
  "performance": [{ "issue": "performance problem", "suggestion": "how to improve" }],
  "improvements": [{ "issue": "code quality issue", "suggestion": "better approach" }],
  "score": 75
}

Return empty arrays [] if there are no issues in a category.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    const feedback = JSON.parse(cleaned);
    return feedback;
}

module.exports = {
    analyzeCode
};
