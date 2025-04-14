// components/ScheduleList.js
// AI GENERATED EXAMPLE CODE - Ben
const ScheduleList = ({ items = [], onEdit, onDelete }) => {
  // Ensure items is always treated as an array
  const scheduleItems = Array.isArray(items) ? items : [];

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
      const date = new Date(dateTimeString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">Your Schedule</h3>

        {scheduleItems.length === 0 ? (
          <p className="text-muted">No schedule items found. Add one to get started!</p>
        ) : (
          <div className="list-group">
            {scheduleItems.map(item => (
              <div key={item.id} className="list-group-item list-group-item-action">
                <div className="d-flex w-100 justify-content-between">
                  <h5 className="mb-1">{item.title}</h5>
                  <div>
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => onEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mb-1">{item.description}</p>
                <small className="text-muted">
                  {formatDateTime(item.startTime)} - {formatDateTime(item.endTime)}
                </small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};