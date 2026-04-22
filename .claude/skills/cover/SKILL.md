---
name: cover
description: Generate cover image for a digest article via Replicate
argument-hint: [article description]
---

Generate a cover image for the article described below.

Article description: $ARGUMENTS

Steps:
1. Based on the article description, compose a prompt for image generation.
   Style: modern, realistic, colourful, real life illustration. No text on the image.
   No people on the image. The image should be relevant to the article description, 
   but not too literal. Use your creativity to come up with an interesting visual 
   representation of the article topic.
2. Use the Replicate MCP server to create a prediction with model
   `ideogram-ai/ideogram-v3-turbo`.
   Input parameters:
   - prompt: your composed prompt in English
   - num_outputs: 1
   - aspect_ratio: "16:9"
3. Download the generated image and save it to the article's directory
   as article_name.png.
4. Report the file path of the saved image.