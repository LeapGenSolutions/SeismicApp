import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";

/* -------------------------------------------------------
   REUSABLE POST BUTTON
------------------------------------------------------- */
const PostIconButton = ({ onClick, disabled }) => {
  const [status, setStatus] = useState("idle");

  const handleClick = () => {
    if (status !== "idle" || disabled) return;

    onClick(
      () => {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      },
      () => {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    );
  };

  let bgClass =
    "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-400";
  let icon = <Send className="w-3.5 h-3.5" />;
  let label = null;

  if (disabled) {
    bgClass = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
  } else if (status === "success") {
    bgClass = "bg-green-50 text-green-700 border-green-300 w-auto px-2";
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Success</span>;
  } else if (status === "error") {
    bgClass = "bg-red-50 text-red-700 border-red-300 w-auto px-2";
    icon = <AlertCircle className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Failed</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || status !== "idle"}
      title="Post Order"
      className={`inline-flex items-center justify-center h-7 rounded-md border transition-all ${
        status === "idle" ? "w-7" : ""
      } ${bgClass}`}
    >
      {icon}
      {label}
    </button>
  );
};

/* -------------------------------------------------------
   ORDERS SECTION
------------------------------------------------------- */
const OrdersSection = ({ ordersData, onOrdersUpdate }) => {
  const orders = ordersData?.orders || [];

  const [isEditing, setIsEditing] = useState(false);
  const [originalOrders, setOriginalOrders] = useState([]);

  const [batchModal, setBatchModal] = useState({
    open: false,
    statusMap: {},
    posting: false,
  });

  /* ---------------- ORDER EDITING ---------------- */
  const handleChange = (index, field, value) => {
    const updatedOrders = [...orders];
    updatedOrders[index] = {
      ...updatedOrders[index],
      [field]: value,
    };

    if (typeof onOrdersUpdate === "function") {
      onOrdersUpdate({ ...ordersData, orders: updatedOrders });
    }
  };

  const handleRemove = (index) => {
    const updatedOrders = [...orders];
    updatedOrders.splice(index, 1);
    if (typeof onOrdersUpdate === "function") {
      onOrdersUpdate({ ...ordersData, orders: updatedOrders });
    }
  };

  const startEditing = () => {
    setOriginalOrders(orders); // Save current state
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Revert to original orders
    if (typeof onOrdersUpdate === "function") {
      onOrdersUpdate({ ...ordersData, orders: originalOrders });
    }
    setIsEditing(false);
  };

  /* ---------------- API ---------------- */
  const postOrder = async (order) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    if (!res.ok) throw new Error("Post failed");
  };

  /* ---------------- BATCH POST ---------------- */
  const openBatchModal = () => {
    const statusMap = {};
    orders.forEach((_, index) => {
      statusMap[index] = "idle";
    });
    setBatchModal({ open: true, statusMap, posting: false });
  };

  const updateBatchStatus = (index, status) => {
    setBatchModal((prev) => ({
      ...prev,
      statusMap: { ...prev.statusMap, [index]: status },
    }));
  };

  const handleBatchPost = async () => {
    if (batchModal.posting) return;
    setBatchModal((prev) => ({ ...prev, posting: true }));

    const indexes = Object.keys(batchModal.statusMap);

    for (const indexStr of indexes) {
      const index = Number(indexStr);
      try {
        updateBatchStatus(index, "loading");
        await postOrder(orders[index]);
        updateBatchStatus(index, "success");
      } catch {
        updateBatchStatus(index, "failed");
      }
    }

    setBatchModal((prev) => ({ ...prev, posting: false }));
  };

  const retrySingle = async (index) => {
    try {
      updateBatchStatus(index, "loading");
      await postOrder(orders[index]);
      updateBatchStatus(index, "success");
    } catch {
      updateBatchStatus(index, "failed");
    }
  };

  /* ---------------- BATCH MODAL ---------------- */
  const BatchModal = () => {
    if (!batchModal.open) return null;

    const indexes = Object.keys(batchModal.statusMap);

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl w-[500px] p-6 relative">
          <button
            onClick={() =>
              setBatchModal({ open: false, statusMap: {}, posting: false })
            }
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold mb-4">Post All Orders</h3>

          <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
            {indexes.map((i) => {
              const index = Number(i);
              const order = orders[index];
              const status = batchModal.statusMap[index];

              return (
                <div
                  key={index}
                  className="flex justify-between items-center border rounded-md p-3"
                >
                  <div>
                    <div className="font-medium">{order.name}</div>
                    {order.order_type && (
                      <div className="text-sm text-gray-600">
                        Type: {order.order_type}
                      </div>
                    )}
                    {order.reason && (
                      <div className="text-sm text-gray-600">
                        Reason: {order.reason}
                      </div>
                    )}
                  </div>

                  <div>
                    {status === "idle" && (
                      <span className="text-gray-400 text-sm">Ready</span>
                    )}
                    {status === "loading" && (
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                    )}
                    {status === "success" && (
                      <CheckCircle2 size={16} className="text-green-600" />
                    )}
                    {status === "failed" && (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <button
                          onClick={() => retrySingle(index)}
                          className="text-xs text-blue-600 underline"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() =>
                setBatchModal({ open: false, statusMap: {}, posting: false })
              }
              className="px-4 py-1 text-sm border rounded-md"
            >
              Close
            </button>

            <button
              onClick={handleBatchPost}
              disabled={batchModal.posting}
              className="px-4 py-1 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {batchModal.posting ? "Posting..." : "Confirm Post"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="border rounded-lg bg-white p-6 space-y-6">
      <h2 className="text-xl font-semibold text-blue-600">Orders</h2>

      {orders.map((item, index) => (
        <div
          key={index}
          className="flex justify-between items-start border p-3 rounded"
        >
          <div className="space-y-2 w-full">
            {/* NAME */}
            {isEditing ? (
              <input
                className="border rounded px-2 py-1 w-full "
                value={item.name || ""}
                onChange={(e) => handleChange(index, "name", e.target.value)}
              />
            ) : (
              <div className="font-medium">{item.name}</div>
            )}

            {/* TYPE */}
            <div className="text-sm text-gray-600">
              <b>Type:</b>{" "}
              {isEditing ? (
                <input
                  className="border rounded px-2 py-1 ml-1"
                  value={item.order_type || ""}
                  onChange={(e) =>
                    handleChange(index, "order_type", e.target.value)
                  }
                />
              ) : (
                item.order_type
              )}
            </div>

            {/* REASON */}
            <div className="text-sm text-gray-600">
              <b>Reason:</b>{" "}
              {isEditing ? (
                <input
                  className="border rounded px-2 py-1 ml-1"
                  value={item.reason || ""}
                  onChange={(e) => handleChange(index, "reason", e.target.value)}
                />
              ) : (
                item.reason
              )}
            </div>

            {/* PRIORITY */}
            <div className="text-sm text-gray-600">
              <b>Priority:</b>{" "}
              {isEditing ? (
                <input
                  className="border rounded px-2 py-1 ml-1"
                  value={item.priority || ""}
                  onChange={(e) =>
                    handleChange(index, "priority", e.target.value)
                  }
                />
              ) : (
                item.priority
              )}
            </div>

            {/* REMOVE BUTTON */}
            {isEditing && (
              <button
                onClick={() => handleRemove(index)}
                className="text-red-500 text-sm"
              >
                Remove Order
              </button>
            )}
          </div>

          {/* POST BUTTON */}
          {!isEditing && (
            <PostIconButton
              onClick={async (onSuccess, onError) => {
                try {
                  await postOrder(item);
                  onSuccess();
                } catch {
                  onError();
                }
              }}
            />
          )}
        </div>
      ))}

      {/* EDIT / Save / CANCEL / BATCH POST */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={openBatchModal}
          disabled={!orders.length}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          Post All Orders
        </button>

        {!isEditing ? (
          <button
            onClick={startEditing}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700"
          >
            Edit Orders
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Save orders
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded-md"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <BatchModal />
    </div>
  );
};

export default OrdersSection;