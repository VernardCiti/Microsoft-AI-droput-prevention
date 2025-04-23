import axios from "axios";

const endpoint = process.env.REACT_APP_AZURE_TEXT_ENDPOINT;
const key = process.env.REACT_APP_AZURE_TEXT_KEY;

export const analyzeSentiment = async (text) => {
  const response = await axios.post(
    `${endpoint}/text/analytics/v3.1/sentiment`,
    {
      documents: [{ id: "1", text }]
    },
    {
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/json"
      }
    }
  );
  return response.data.documents[0].sentiment;
};