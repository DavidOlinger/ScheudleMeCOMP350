// components/ScheduleForm.js
// AI GENERATED EXAMPLE CODE - Ben
const ScheduleForm = ({ onSubmit, initialItem, onCancel }) => {
  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const getOneHourLater = () => {
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);
    oneHourLater.setMinutes(oneHourLater.getMinutes() - oneHourLater.getTimezoneOffset());
    return oneHourLater.toISOString().slice(0, 16);
  };

  const defaultItem = {
    title: '',
    description: '',
    startTime: getCurrentDateTime(),
    endTime: getOneHourLater()
  };

  const [formData, setFormData] = React.useState(initialItem || defaultItem);

  React.useEffect(() => {
    if (initialItem) {
      // Format dates for initialItem if needed
      const formattedItem = {
        ...initialItem,
        startTime: initialItem.startTime ? formatDateForInput(initialItem.startTime) : getCurrentDateTime(),
        endTime: initialItem.endTime ? formatDateForInput(initialItem.endTime) : getOneHourLater()
      };
      setFormData(formattedItem);
    } else {
      setFormData(defaultItem);
    }
  }, [initialItem]);

  function formatDateForInput(dateString) {
    try {
      const date = new Date(dateString);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      return date.toISOString().slice(0, 16);
    } catch (e) {
      console.error("Error formatting date:", e);
      return getCurrentDateTime();
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert the datetime strings to proper ISO format for JSON
    const formattedData = {
      ...formData,
      id: initialItem?.id,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString()
    };

    onSubmit(formattedData);

    if (!initialItem) {
      setFormData(defaultItem);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="card-title">{initialItem ? 'Edit Schedule Item' : 'Add Schedule Item'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label">Title</label>
            <input
              type="text"
              className="form-control"
              id="title"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <div className="mb-3">
            <label htmlFor="startTime" className="form-label">Start Time</label>
            <input
              type="datetime-local"
              className="form-control"
              id="startTime"
              name="startTime"
              value={formData.startTime || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="endTime" className="form-label">End Time</label>
            <input
              type="datetime-local"
              className="form-control"
              id="endTime"
              name="endTime"
              value={formData.endTime || ''}
              onChange={handleChange}
              required
            />
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary">
              {initialItem ? 'Update' : 'Add to Schedule'}
            </button>

            {initialItem && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};