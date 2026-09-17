export function getModelForAttempt(modelType: string | undefined, attempt: number): string {
  let baseModel = 'openai/gpt-oss-120b';

  switch (modelType) {
    case 'fast':
      baseModel = 'openai/gpt-oss-20b';
      break;
    case 'thinking':
    case 'maps':
    case 'search':
    case 'balanced':
    default:
      baseModel = 'openai/gpt-oss-120b';
      break;
  }

  let model = baseModel;

  if (attempt > 0) {
    if (attempt === 1) {
      if (baseModel === 'openai/gpt-oss-120b') model = 'openai/gpt-oss-20b';
      else model = 'groq/compound';
    } else if (attempt === 2) {
      model = 'groq/compound';
    } else {
      model = 'groq/compound-mini';
    }
  }

  return model;
}
