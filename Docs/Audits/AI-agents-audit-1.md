
Summary of the audit and fixes:

---

## AI integration audit – fixes applied

### Bugs fixed

#### 1. **Double LLM call on step 5 (Sync)** – fixed
- **Issue:** Step 5 called `executeAgent` twice: once with `step.prompt(prevOutput)` and again with `syncPrompt` in the step 5 block.
- **Effect:** 50% extra token usage on every workflow run.
- **Change:** Step 5 now uses only the sync prompt; the redundant first call was removed.

#### 2. **Unbounded prompt size** – fixed
- **Issue:** `implementationOutput` from step 3 can be very large (e.g. 50KB+). It was passed through steps 4 and 5 without limits.
- **Effect:** Large prompts could cause high token usage and cost.
- **Change:** Added `truncate()` for prompts, capped at 16,000 characters (~4K tokens).

#### 3. **Concurrent workflows** – fixed
- **Issue:** No check for an active workflow. Users could start multiple workflows in parallel.
- **Effect:** Multiple workflows could run at once, multiplying token usage.
- **Change:** API returns 429 if a workflow is already queued or running for the project.

#### 4. **Task length limit** – added
- **Issue:** No limit on task input length.
- **Effect:** Very long tasks could inflate prompts and costs.
- **Change:** Task input limited to 2,000 characters.

---

### Files changed

| File | Changes |
|------|---------|
| `lib/agents/workflow-executor.ts` | 1. Removed double `executeAgent` call for step 5. 2. Added `truncate()` for prompts, capped at 16K chars. |
| `app/api/workflows/run/route.ts` | 1. Check for active workflow before starting. 2. Task length limit (2000 chars). |

---

### Not changed (no issues found)

- **Retry logic:** No retries that could cause repeated API calls.
- **`max_tokens`:** 4096 per call is reasonable.
- **`createPullRequest`:** Uses Octokit; no hardcoded PR URL.
- **Chat sidebar:** `sending` state prevents double-click during one request; API-level duplicate prevention covers rapid submissions.

---

### Expected token usage

- **Before:** ~6 LLM calls per workflow (5 steps + 1 extra for step 5).
- **After:** 5 LLM calls per workflow.
- **Prompt size:** Capped at ~16K chars per prompt.

---

### Testing recommendation

1. Run a workflow and confirm the Sync step still completes.
2. Submit a second workflow while the first is running and confirm the 429 response.
3. Submit a task longer than 2000 characters and confirm the 400 response.