// components/App.js
// AI GENERATED EXAMPLE CODE - Ben
const App = () => {
  const [scheduleItems, setScheduleItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [editItem, setEditItem] = React.useState(null);

  React.useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:7000/api/schedule');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      const data = await response.json();
      // Ensure data is always an array
      setScheduleItems(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError(`Failed to load schedule: ${error.message}`);
      setScheduleItems([]);
      setLoading(false);
    }
  };

  const handleAddItem = async (item) => {
    try {
      setError(null);
      const response = await fetch('http://localhost:7000/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      // Success!
      fetchSchedule();
    } catch (error) {
      console.error('Error adding item:', error);
      setError(`Failed to add item: ${error.message}`);
    }
  };

  const handleUpdateItem = async (item) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:7000/api/schedule/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      fetchSchedule();
      setEditItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      setError(`Failed to update item: ${error.message}`);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      setError(null);
      const response = await fetch(`http://localhost:7000/api/schedule/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
      }

      fetchSchedule();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(`Failed to delete item: ${error.message}`);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Schedule Builder</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row">
        <div className="col-md-4">
          <ScheduleForm
            onSubmit={editItem ? handleUpdateItem : handleAddItem}
            initialItem={editItem}
            onCancel={() => setEditItem(null)}
          />
        </div>
        <div className="col-md-8">
          {loading ? (
            <p>Loading schedule...</p>
          ) : (
            <ScheduleList
              items={scheduleItems}
              onEdit={handleEdit}
              onDelete={handleDeleteItem}
            />
          )}
        </div>
      </div>
    </div>
  );
};