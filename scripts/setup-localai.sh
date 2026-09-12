#!/bin/bash
# wait for localai to be ready
echo "Waiting for LocalAI to be ready at http://localhost:8080/readyz..."

until curl -s -f http://localhost:8080/readyz > /dev/null; do
  sleep 5
done

MODEL_ID=${1:-stablediffusion}

echo "LocalAI is ready. Applying the ${MODEL_ID} model..."

curl -s -X POST http://localhost:8080/models/apply \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${MODEL_ID}\"}"

echo ""
echo "Model installation triggered for ${MODEL_ID}."
echo "You can view the progress by running: docker logs -f wb_newsfeed_localai"
