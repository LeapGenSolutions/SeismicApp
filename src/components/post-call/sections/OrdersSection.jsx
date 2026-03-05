import { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

/* -------------------------------------------------------
   INLINE POST BUTTON
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
    bgClass =
      "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed";
  } else if (status === "success") {
    bgClass =
      "bg-green-50 text-green-700 border-green-300 w-auto px-2";
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Success</span>;
  } else if (status === "error") {
    bgClass =
      "bg-red-50 text-red-700 border-red-300 w-auto px-2";
    icon = <AlertCircle className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Failed</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || status !== "idle"}
      className={`inline-flex items-center justify-center h-7 rounded-md border transition-all ${bgClass} ${
        status === "idle" ? "w-7" : ""
      }`}
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
  const [editableOrders, setEditableOrders] = useState([]);
  const [removedKeys, setRemovedKeys] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    order: null,
    onSuccess: null,
    onError: null,
  });

  const [batchModal, setBatchModal] = useState({
    open: false,
    statusMap: {},
    posting: false,
  });

  useEffect(() => {
    setEditableOrders(ordersData?.orders || []);
  }, [ordersData]);

  /* ---------------- Remove Logic ---------------- */

  const handleRemove = (key) => {
    if (!isEditing) return;
    setRemovedKeys((prev) => ({ ...prev, [key]: true }));
  };

  /* ---------------- API ---------------- */

  const postOrder = async (order) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });

    if (!res.ok) throw new Error();
  };

  /* ================= BATCH ================= */

  const openBatchModal = () => {
    const initialStatus = {};

    editableOrders.forEach((_, index) => {
      if (!removedKeys[index]) {
        initialStatus[index] = "idle";
      }
    });

    setBatchModal({
      open: true,
      statusMap: initialStatus,
      posting: false,
    });
  };

  const updateBatchStatus = (index, status) => {
    setBatchModal((prev) => ({
      ...prev,
      statusMap: {
        ...prev.statusMap,
        [index]: status,
      },
    }));
  };

  const handleBatchPost = async () => {
    if (batchModal.posting) return;

    setBatchModal((prev) => ({ ...prev, posting: true }));

    const indexes = Object.keys(batchModal.statusMap);

    for (const indexStr of indexes) {
      const index = Number(indexStr);
      const order = editableOrders[index];

      try {
        updateBatchStatus(index, "loading");
        await postOrder(order);
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
      await postOrder(editableOrders[index]);
      updateBatchStatus(index, "success");
    } catch {
      updateBatchStatus(index, "failed");
    }
  };

  /* ================= CONFIRM MODAL ================= */

  const ConfirmModal = () => {
    if (!confirmModal.open) return null;
    const isPost = confirmModal.type === "post";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-lg shadow-xl w-[400px] p-6 relative">
          <button
            onClick={() =>
              setConfirmModal({
                open: false,
                type: null,
                order: null,
                onSuccess: null,
                onError: null,
              })
            }
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold mb-4">
            {isPost ? "Confirm Post" : "Confirm Removal"}
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to {isPost ? "post" : "remove"}{" "}
            <span className="font-semibold">
              {confirmModal.order?.name}
            </span>
            ?
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() =>
                setConfirmModal({
                  open: false,
                  type: null,
                  order: null,
                  onSuccess: null,
                  onError: null,
                })
              }
              className="px-4 py-1 text-sm border rounded-md"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                if (isPost) {
                  try {
                    await postOrder(confirmModal.order);
                    confirmModal.onSuccess?.();
                  } catch {
                    confirmModal.onError?.();
                  }
                } else {
                  handleRemove(confirmModal.order.__key);
                }

                setConfirmModal({
                  open: false,
                  type: null,
                  order: null,
                  onSuccess: null,
                  onError: null,
                });
              }}
              className={`px-4 py-1 text-sm rounded-md text-white ${
                isPost
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {isPost ? "Post" : "Remove"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ================= BATCH MODAL ================= */

  const BatchModal = () => {
    if (!batchModal.open) return null;

    const indexes = Object.keys(batchModal.statusMap);
    const total = indexes.length;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-2xl w-[520px] p-6 relative">
          <button
            onClick={() =>
              setBatchModal({
                open: false,
                statusMap: {},
                posting: false,
              })
            }
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold">Post All Orders</h3>
          <p className="text-sm text-gray-500 mb-4">
            Total Orders: {total}
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
            {indexes.map((i) => {
              const index = Number(i);
              const status = batchModal.statusMap[index];
              const order = editableOrders[index];

              return (
                <div
                  key={index}
                  className="flex justify-between items-start border rounded-md p-3"
                >
                  <div>
                    <div className="font-medium">{order.name}</div>

                    {order.order_type && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Type:</span> {order.order_type}
                      </div>
                    )}

                    {order.reason && (
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Reason:</span> {order.reason}
                      </div>
                    )}

                    {order.additional_instructions && (
                      <div className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Instructions:</span>{" "}
                        {order.additional_instructions}
                      </div>
                    )}
                  </div>

                  <div className="ml-4">
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
                setBatchModal({
                  open: false,
                  statusMap: {},
                  posting: false,
                })
              }
              className="px-4 py-1 text-sm border rounded-md"
            >
              Close
            </button>

            <button
              onClick={handleBatchPost}
              disabled={batchModal.posting || !total}
              className="px-4 py-1 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {batchModal.posting ? "Posting..." : "Confirm Post"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ================= UI ================= */

  return (
    <div className="border rounded-lg bg-white p-6 space-y-6 relative">
      <h2 className="text-xl font-semibold text-blue-600">
        Orders
      </h2>

      {editableOrders.map((item, index) => {
        if (removedKeys[index]) return null;

        return (
          <div
            key={index}
            className="flex justify-between items-start border p-3 rounded"
          >
            <div>
              <div className="font-medium">{item.name}</div>

              {item.order_type && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Type:</span> {item.order_type}
                </div>
              )}

              {item.reason && (
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Reason:</span> {item.reason}
                </div>
              )}

              {item.additional_instructions && (
                <div className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Instructions:</span>{" "}
                  {item.additional_instructions}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <PostIconButton
                onClick={(onSuccess, onError) =>
                  setConfirmModal({
                    open: true,
                    type: "post",
                    order: item,
                    onSuccess,
                    onError,
                  })
                }
              />

              {isEditing && (
                <button
                  onClick={() =>
                    setConfirmModal({
                      open: true,
                      type: "remove",
                      order: { ...item, __key: index },
                    })
                  }
                  className="text-gray-400 hover:text-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Bottom Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
        <button
          onClick={openBatchModal}
          disabled={!editableOrders.length}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          Post All Orders
        </button>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-600 text-white hover:bg-yellow-700 px-4 py-2 rounded-md"
          >
            Edit Orders
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                onOrdersUpdate?.(editableOrders);
                setIsEditing(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Save Orders
            </button>

            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <ConfirmModal />
      <BatchModal />
    </div>
  );
};

export default OrdersSection;