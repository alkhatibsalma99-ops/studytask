const MAX_TITLE_LENGTH = 200;

function validateNewTask(body) {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { errors: ["Request body must be a JSON object."] };
  }

  const errors = [];

  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (typeof body.title !== "string" || title.length === 0) {
    errors.push("Title is required and must be a non-empty string.");
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title must be at most ${MAX_TITLE_LENGTH} characters.`);
  }

  let deadline;

  if (typeof body.deadline !== "string" || body.deadline.trim() === "") {
    errors.push(
      'Deadline is required and must be a date string, for example "2026-10-10T23:59".'
    );
  } else {
    const parsed = new Date(body.deadline);

    if (Number.isNaN(parsed.getTime())) {
      errors.push(`Deadline "${body.deadline}" is not a valid date.`);
    } else {
      deadline = parsed.toISOString();
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { value: { title, deadline } };
}

module.exports = { validateNewTask, MAX_TITLE_LENGTH };
