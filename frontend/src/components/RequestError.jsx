export default function RequestError({ message, onRetry, retryLabel = "Try again" }) {
  if (!message) return null;

  return (
    <div className="inline-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="text-button" type="button" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
