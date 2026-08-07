## Reflection

_This is intentionally left as a template. Fill in your own honest answers, not "it was great!" generalities, the eval criteria specifically checks for real thinking here._

## What was hardest? Why?

_The hardest part of this project was realising that getting the application to work locally was only one part of the job. One of the biggest challenges came from the `gemini-2.5-flash` model. The application worked correctly during local development, but the deployed version broke because the model version I had built against was no longer available in the same way in production. That forced me to stop looking at the problem as a simple coding issue and start debugging it as a production issue. I had to work through deployment logs, trace the failing request, identify the model availability problem, and make the necessary changes before the application could work reliably again._

_Another frustrating issue was the `rawInput`/`title` mismatch. The frontend and the part of the application handling the AI request were effectively expecting different shapes of data. Neither side was obviously broken in isolation, but the mismatch caused the feature to fail. It was a good reminder that interfaces between parts of an application can be just as important as the individual components themselves._

_I also spent more time than expected investigating Lighthouse score variations. At one point, the score could move significantly between runs even though I had made no code changes. That was initially frustrating because it made it difficult to tell whether an improvement was actually caused by my changes or simply by the audit environment. Eventually, I learned to treat performance scores as measurements with some variance rather than absolute numbers._

## What would you do differently next time?

_The biggest change I would make is to verify external dependencies before building too deeply around them. In particular, I would check the availability, lifecycle and production support of a specific AI model before making it a core dependency of the application. Local success can create a false sense of security when the application depends on an external service that can change independently of the codebase._

_I would also define the request and response contract between the frontend and AI-related code much earlier. The `rawInput`/`title` bug was avoidable. A shared type, documented contract, or schema referenced by both sides would have made the mismatch much easier to catch before deployment._

_Finally, I would treat production validation as part of development rather than something that happens at the end. Testing locally, running automated tests, checking accessibility, reviewing logs and testing the deployed application should happen continuously throughout the project._

## One thing you learned that surprised you

_The biggest surprise was how different "passing tests" and "working software" can be. I had tests passing, yet real bugs still made it into the application. That does not mean the tests were useless; it showed me that tests only protect the behaviour they are actually written to verify. The `rawInput` mismatch and the production model issue exposed gaps that the existing tests did not cover._

_I was also surprised by how much Lighthouse scores could change without any code changes. It reinforced that engineering decisions should not be based on a single metric or a single audit run. Performance needs to be evaluated consistently and alongside real user experience._

_Overall, this capstone changed how I think about "done." Before, getting the feature working was the main milestone. After going through deployment failures, debugging logs, testing gaps and performance variance, I see production readiness differently: **shipping means understanding how the application behaves when things go wrong, not just when everything goes right.**_
