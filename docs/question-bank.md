# Re-Encoded Vocabulary Question Bank Documentation

This document describes the architectural layout, schema design, and authoring guidelines for the Re-Encoded Vocabulary multi-subject question bank (`data/question-bank.json`). It also outlines how to integrate this question bank into a later interactive quiz system using a dedicated quiz adapter.

---

## 1. Architectural Overview & Design Philosophy

The question bank is designed as an extensible, versioned, and language-agnostic data store that supports multi-subject assessments. The key objective is to test **conceptual understanding** rather than trivial, rote-memorization of specific glossary wording.

To achieve this, the question bank separates structural layout (how the interface interacts with the question) from cognitive formats (how the question assesses knowledge).

### Versioning
The bank uses semantic versioning at the root level (`"version": "1.0.0"`). Any breaking change in the JSON schema or format expectations must increment the major version, while additive, backward-compatible modifications increment the minor or patch version.

---

## 2. JSON Schema Definition

The structural integrity of the question bank is governed by `schemas/question-bank.schema.json`. Below is the complete structure of the schema:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "QuestionBank",
  "type": "object",
  "required": ["version", "questions"],
  "properties": {
    "version": {
      "type": "string"
    },
    "questions": {
      "type": "array",
      "items": {
        "anyOf": [
          { "$ref": "#/definitions/MultipleChoiceQuestion" },
          { "$ref": "#/definitions/TermRecallQuestion" }
        ]
      }
    }
  },
  "definitions": {
    "BaseQuestion": {
      "type": "object",
      "required": [
        "id",
        "type",
        "subject",
        "category",
        "difficulty",
        "term_references",
        "cognitive_format",
        "prompt",
        "explanation"
      ],
      "properties": {
        "id": { "type": "string", "pattern": "^[a-zA-Z0-9_-]+$" },
        "type": { "type": "string", "enum": ["multiple-choice", "term-recall"] },
        "subject": { "type": "string" },
        "category": { "type": "string" },
        "difficulty": { "type": "string", "enum": ["easy", "medium", "hard"] },
        "term_references": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1
        },
        "prerequisites": {
          "type": "array",
          "items": { "type": "string" }
        },
        "cognitive_format": { "type": "string", "enum": ["definition-recall", "scenario", "application", "compare-contrast"] },
        "prompt": { "type": "string", "minLength": 10 },
        "explanation": { "type": "string", "minLength": 10 }
      }
    },
    "MultipleChoiceQuestion": {
      "allOf": [
        { "$ref": "#/definitions/BaseQuestion" },
        {
          "type": "object",
          "required": ["options"],
          "properties": {
            "type": { "type": "string", "enum": ["multiple-choice"] },
            "options": {
              "type": "array",
              "items": {
                "type": "object",
                "required": ["id", "text", "is_correct", "explanation"],
                "properties": {
                  "id": { "type": "string" },
                  "text": { "type": "string" },
                  "is_correct": { "type": "boolean" },
                  "explanation": { "type": "string" }
                }
              },
              "minItems": 3,
              "maxItems": 6
            }
          }
        }
      ]
    },
    "TermRecallQuestion": {
      "allOf": [
        { "$ref": "#/definitions/BaseQuestion" },
        {
          "type": "object",
          "required": ["acceptable_answers", "normalization_rules"],
          "properties": {
            "type": { "type": "string", "enum": ["term-recall"] },
            "acceptable_answers": {
              "type": "array",
              "items": { "type": "string" },
              "minItems": 1
            },
            "normalization_rules": {
              "type": "object",
              "required": ["case_sensitive", "trim_whitespace", "ignore_punctuation", "ignore_articles"],
              "properties": {
                "case_sensitive": { "type": "boolean" },
                "trim_whitespace": { "type": "boolean" },
                "ignore_punctuation": { "type": "boolean" },
                "ignore_articles": { "type": "boolean" },
                "synonyms_allowed": { "type": "boolean" },
                "description": { "type": "string" }
              }
            }
          }
        }
      ]
    }
  }
}
```

---

## 3. Question Formats & Normalized Validation

The schema supports two primary interaction types:

### A. Multiple-Choice (MCQ)
MCQ records ensure a highly guided and didactic assessment.
* **Option-Level Plausibility**: Distractors must avoid obviously silly or non-contextual jargon. They should represent common misunderstandings or closely related terms (e.g., confusing a *List* with a *Tuple*, or *Utilitarianism* with *Deontology*).
* **Option-Level Explanations**: Every single option—whether correct or incorrect—must contain a concise `explanation` field. When a user selects a distractor, the interface should display the specific feedback explaining *why* that distractor is incorrect, reinforcing the correct concept immediately.

### B. Term-Recall (Typed Answer)
Term-Recall records require active retrieval, which is significantly more cognitively demanding.
* **Avoiding Executable Code**: To avoid security risks (e.g., Code Injection, XSS, or environment pollution), the validation logic is strictly non-executable. Rules are defined purely as declarative boolean flags inside the `normalization_rules` object.
* **Normalization Expectations**:
  * `case_sensitive`: Tells the client parser whether to compare character cases.
  * `trim_whitespace`: Tells the client to strip leading and trailing whitespace.
  * `ignore_punctuation`: Tells the client to ignore punctuation marks (commas, periods, apostrophes, etc.).
  * `ignore_articles`: Tells the client to strip common articles (e.g., "the", "a", "an") before comparison.
  * `synonyms_allowed`: Indicates whether common synonyms or alternate notations (like shortened names) are allowed.
  * `description`: A plain-text instruction explaining to future developers exactly how the comparison should be normalized.

---

## 4. Cognitive Formats (Testing Deep Understanding)

To move beyond shallow definitions, the question bank categorizes questions into four distinct cognitive formats:

| Format | Cognitive Depth | Description |
| :--- | :--- | :--- |
| **definition-recall** | Knowledge Retrieval | Basic, straightforward identification of a term based on its formal definition. Useful as a baseline check. |
| **scenario** | Contextual Application | Placing the term inside a realistic situation (e.g., clinical workflows, group chats, political dilemmas) and asking the student to diagnose or classify the situation. |
| **application** | Technical Problem-Solving | Presenting a technical problem or rule-based goal and requiring the student to select or type the exact concept or command that achieves it. |
| **compare-contrast** | Analytical Evaluation | Highlighting two related concepts (e.g., *Class vs. Object* or *Rationalism vs. Empiricism*) and testing the student's ability to identify their fundamental distinguishing boundaries. |

*Out of the 50 starter questions authored in `data/question-bank.json`, **40 questions** are categorized as `scenario`, `application`, or `compare-contrast` formats—well exceeding the baseline acceptance criteria of 12 questions.*

---

## 5. Starter Question Bank Analysis

The authored question bank contains **50 complete questions** split evenly across the active glossary subjects:

* **Subject `coding` (25 questions)**:
  * 15 Multiple-Choice Questions
  * 10 Term-Recall Questions
  * 20 of these check Scenarios, Comparisons, or Applications (cognitive formats: `scenario`, `application`, `compare-contrast`).
* **Subject `philosophy` (25 questions)**:
  * 15 Multiple-Choice Questions
  * 10 Term-Recall Questions
  * 20 of these check Scenarios, Comparisons, or Applications (cognitive formats: `scenario`, `application`, `compare-contrast`).

---

## 6. Comprehensive Authoring Guidance

Future authors expanding this question bank must strictly adhere to the following five quality pillars:

### A. Mitigating Ambiguity
1. **Unambiguous Stems**: Ensure the question prompt contains all necessary contextual boundaries. A reader should be able to guess the correct answer before looking at the multiple-choice options.
2. **Clear Boundaries for Distractors**: Distractors must be clearly incorrect under the stated conditions. Avoid overlap where multiple options could be argued as "partially correct."
3. **Unambiguous Target Terms**: For term-recall questions, ensure that the prompt cannot be answered by other valid glossary terms. For instance, if the target is "For Loop", specify that the sequence terminates automatically over a finite collection to differentiate it from a "While Loop".

### B. Accessibility
1. **Formatting**: Prompt texts must use clear, structured language with standard punctuation. Avoid excessively nested clauses or convoluted sentences.
2. **No Visual-Only Cues**: Never write questions that rely on visual characteristics (e.g., "Look at the red text below" or "Which option has the bold font"). All hints must be readable by screen readers.
3. **Keyboard and Screen-Reader Friendly Prompts**: Keep prompts free of complex non-standard characters, emojis that alter meaning, or overly wide indentation blocks that might read poorly on standard screen readers.

### C. Bias Mitigation
1. **Cultural and Context Neutrality**: Avoid assuming localized geographic knowledge (e.g., referencing local television shows, specific state laws, or specialized localized terminology).
2. **Gender Neutrality**: Use singular "they/them/their" or neutral professional roles (e.g., "The physician," "The developer") rather than gender-binary pronouns.
3. **Globalizing Scenarios**: Ensure that scenarios describe general, widely understood human interactions or standardized industrial practices.

### D. Calibrating Difficulty
1. **Easy**: Single-step recognition. Direct, straightforward definition recall or a simple application of a well-defined primitive (e.g., identifying a string data type).
2. **Medium**: Two-step reasoning. Applying a core concept inside a specific, multi-layered scenario, or identifying the main mechanism of a dynamic process (e.g., choosing a loop type for an indeterminate condition).
3. **Hard**: Multi-step comparison or design evaluation. Distinguishing boundary details between two highly similar concepts, or evaluating structural pros and cons (e.g., *Severity vs. Priority* or *Existence Precedes Essence*).

### E. Future Localization
1. **Linguistic Unbundling**: Do not embed grammatical structures or assumptions inside the JSON keys or metadata.
2. **Standard Formats**: Use international standard formats for dates (ISO-8601: `YYYY-MM-DD`), currency notation, and metric measurements if referenced.
3. **Idiom Avoidance**: Avoid cultural idioms, regional jokes, or local slang that would not translate cleanly or naturally into other target languages.

---

## 7. Integration Follow-Up & Quiz Adapter Recommendations

A quiz adapter can easily consume this question bank to augment the current application's quiz mode. Below are structural guidelines on how to implement the selection and delivery logic:

### A. Selecting Questions by Subject and Category
The client can filter the `questions` array using simple declarative predicates.
```js
// Select questions for the current active quiz tab
function getQuestionsForSubject(subjectKey) {
  return questionBank.questions.filter(q => q.subject === subjectKey);
}

// Select category-specific subsets (e.g., only 'stoicism' under 'philosophy')
function getQuestionsForCategory(subjectKey, categoryKey) {
  return questionBank.questions.filter(q => q.subject === subjectKey && q.category === categoryKey);
}
```

### B. Selecting Questions by Difficulty
To provide a smooth, progressive learning curve, the quiz adapter should implement **progressive difficulty escalation**:
1. Start the quiz session with 80% `easy` questions and 20% `medium` questions to build student confidence.
2. As the user achieves a scoring streak (e.g., `streak >= 3`), gradually shift the distribution towards `medium` (50%) and `hard` (50%) questions.
3. If the user misses a question and their streak resets to 0, decay the difficulty back to easier baselines to prevent frustration and reinforce foundational concepts.

### C. Incorporating Weak-Term Signals
The true power of this question bank lies in linking assessments to the student's learning history. If the user has marked cards as "unfamiliar", struggled with typed answers in the current glossary, or repeatedly missed specific terms:
1. Maintain an in-memory dictionary of **weak terms** (terms that have been missed or starred for review).
2. Before selecting the next question, check if any questions in the bank have these weak terms in their `term_references` array.
3. **Priority Routing**: Inject these specific questions with high priority into the active quiz pool.
4. **Prerequisite Gating**: Utilize the `prerequisites` field. If a hard question has a prerequisite question ID or term, do not serve it until the user has successfully answered the prerequisite question first.
