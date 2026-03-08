import { useState, useEffect } from "react";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { postDME, postImaging, postLab, postOther, postPatientInfo, postPrescription, postProcedure, postReferral, postVaccine } from "../../../api/orders";

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
      "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed";
  } else if (status === "success") {
    bgClass =
      "bg-green-50 text-green-700 border-green-200 w-auto px-2";
    icon = <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Success</span>;
  } else if (status === "error") {
    bgClass =
      "bg-red-50 text-red-700 border-red-200 w-auto px-2";
    icon = <AlertCircle className="w-3.5 h-3.5 mr-1" />;
    label = <span className="text-xs font-medium">Failed</span>;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || status !== "idle"}
      className={`inline-flex items-center justify-center h-7 rounded-md border transition-all ${bgClass} ${status === "idle" ? "w-7" : ""
        }`}
    >
      {icon}
      {label}
    </button>
  );
};


const OrdersSection = ({ ordersData, onOrdersUpdate, doctorEmail, encounterId, practiceId, appointmentId }) => {
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
    // Basic deduplication based on order name/intent and type when data comes in
    const uniqueOrders = [];
    const seen = new Set();
    const incoming = ordersData?.orders || [];

    for (const order of incoming) {
      const orderName = order.selected_order_name || order.clinical_intent || order.name || "";
      const type = order.order_type || "";
      const key = `${orderName}-${type}`.toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueOrders.push(order);
      }
    }
    setEditableOrders(uniqueOrders);
  }, [ordersData]);

  /* ---------------- Remove / Edit Logic ---------------- */

  const handleRemove = (key) => {
    if (!isEditing) return;
    setRemovedKeys((prev) => ({ ...prev, [key]: true }));
  };

  const handleEditField = (index, field, value) => {
    if (!isEditing) return;
    setEditableOrders((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  /* ---------------- API ---------------- */

  const postOrder = async (order, doctorEmail, encounterId, practiceId) => {
    let res;
    if(order.order_type === "Imaging") {
      res = await postImaging(doctorEmail, encounterId, order, practiceId);
    } else if(order.order_type === "Lab") {
      res = await postLab(doctorEmail, encounterId, order, practiceId);
    } else if(order.order_type === "Procedure") {
      res = await postProcedure(doctorEmail, encounterId, order, practiceId);
    } else if(order.order_type === "Other") {
      res = await postOther(doctorEmail, encounterId, order, practiceId);
    } else if(order.order_type === "Referral") {
      res = await postReferral(doctorEmail, encounterId, order, practiceId);
    } else if(order.order_type === "Vaccine") {
      res = await postVaccine(doctorEmail, encounterId, order, practiceId);
    } else if(order.order_type === "PatientInfo") {
      res = await postPatientInfo(doctorEmail, encounterId, order, practiceId);
    } else if(order.order_type === "Prescription") {
      res = await postPrescription(doctorEmail, encounterId, order, practiceId);
    } else if(order.order_type === "DME") {
      res = await postDME(doctorEmail, encounterId, order, practiceId);
    }

    if (!res.ok) throw new Error();
  };

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
        await postOrder(order, doctorEmail, encounterId, practiceId);
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
      await postOrder(editableOrders[index], doctorEmail, encounterId, practiceId);
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
              {confirmModal.order?.selected_order_name || confirmModal.order?.clinical_intent || confirmModal.order?.name}
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
                    await postOrder(confirmModal.order, doctorEmail, encounterId, practiceId);
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
              className={`px-4 py-1 text-sm rounded-md text-white ${isPost
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
                  className="flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center justify-between mb-2 border-b border-gray-200 pb-2">
                      <h4 className="font-semibold text-gray-900">{order.clinical_intent || order.name || "Unknown Intent"}</h4>
                      {order.priority && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                           ${order.priority?.toLowerCase() === 'stat' || order.priority?.toLowerCase() === 'urgent'
                            ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                            : 'bg-green-50 text-green-700 ring-1 ring-green-600/20'}`}>
                          {order.priority}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                      {order.selected_order_name && (
                        <div className="text-xs text-gray-600 truncate"><span className="font-semibold text-gray-500">Name:</span> {order.selected_order_name}</div>
                      )}
                      {order.order_type && (
                        <div className="text-xs text-gray-600 truncate"><span className="font-semibold text-gray-500">Type:</span> {order.order_type}</div>
                      )}
                    </div>
                    {(order.additional_instructions || order.notes) && (
                      <div className="text-xs text-gray-500 mt-2 italic truncate">
                        <span className="font-semibold text-gray-400 not-italic mr-1">Notes:</span>
                        {order.additional_instructions || order.notes}
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col items-end gap-1 min-w-[60px]">
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
    <div className="space-y-6 text-gray-900 leading-snug">
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h3 className="font-semibold text-black text-lg">
          Clinical Orders
        </h3>
        <span className="text-sm rounded-full bg-blue-50 text-blue-700 px-3 py-0.5 border border-blue-100 font-medium">{editableOrders.length} Orders</span>
      </div>

      <div className="space-y-4">
        {editableOrders.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-4">
            No orders associated with this encounter.
          </p>
        ) : (
          <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
            {editableOrders.map((item, index) => {
              if (removedKeys[index]) return null;

              // Action Buttons block (Post / Delete)
              const actionButtons = (
                <div className="flex flex-col items-center justify-center gap-3 w-16 px-4 border-l border-gray-100">
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
                      className="text-gray-400 hover:text-red-600 transition-colors bg-white w-7 h-7 flex items-center justify-center border border-gray-200 rounded hover:border-red-200"
                      title="Remove Order"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );

              if (isEditing) {
                return (
                  <div key={index} className="flex py-6 group">
                    <div className="flex-1 space-y-4 pr-6">

                      {/* Clinical Content */}
                      <div>
                        <span className="block text-sm font-semibold text-gray-700 mb-1">Clinical Content <span className="text-red-500">*</span></span>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                          value={item.clinical_intent || item.name || ""}
                          onChange={(e) => {
                            if (item.clinical_intent !== undefined) handleEditField(index, "clinical_intent", e.target.value);
                            else handleEditField(index, "name", e.target.value);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Type */}
                        <div>
                          <span className="block text-sm font-semibold text-gray-700 mb-1">Type</span>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                            value={item.order_type || ""}
                            onChange={(e) => handleEditField(index, "order_type", e.target.value)}
                          />
                        </div>

                        {/* Name */}
                        <div>
                          <span className="block text-sm font-semibold text-gray-700 mb-1">Name</span>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm"
                            value={item.selected_order_name || ""}
                            onChange={(e) => handleEditField(index, "selected_order_name", e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Priority */}
                      <div className="w-1/2 pr-2">
                        <span className="block text-sm font-semibold text-gray-700 mb-1">Priority</span>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 bg-white shadow-sm"
                          value={item.priority || "Routine"}
                          onChange={(e) => handleEditField(index, "priority", e.target.value)}
                        >
                          <option value="Routine">Routine</option>
                          <option value="Stat">Stat</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>

                      {/* Provider Notes */}
                      <div>
                        <span className="block text-sm font-semibold text-gray-700 mb-1">Provider Notes</span>
                        <textarea
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-blue-500 shadow-sm resize-y"
                          value={item.additional_instructions || item.notes || ""}
                          onChange={(e) => handleEditField(index, "additional_instructions", e.target.value)}
                          placeholder="Add clinical notes..."
                        />
                      </div>

                    </div>
                    {actionButtons}
                  </div>
                );
              }

              return (
                <div key={index} className="flex py-6 group hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1 space-y-3 pr-6">

                    {/* Clinical Content */}
                    {(item.clinical_intent || item.name) && (
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">Clinical Content</span>
                        <span className="text-sm text-gray-900">{item.clinical_intent || item.name}</span>
                      </div>
                    )}

                    {/* Type */}
                    {item.order_type && (
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">Type</span>
                        <span className="text-sm text-gray-900">{item.order_type}</span>
                      </div>
                    )}

                    {/* Name */}
                    {item.selected_order_name && (
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">Name</span>
                        <span className="text-sm text-gray-900">{item.selected_order_name}</span>
                      </div>
                    )}

                    {/* Priority */}
                    {item.priority && (
                      <div>
                        <span className="block text-sm font-semibold text-gray-700">Priority</span>
                        <span className={`inline-flex px-2 py-0.5 mt-0.5 rounded text-xs font-medium border
                          ${item.priority?.toLowerCase() === 'stat' || item.priority?.toLowerCase() === 'urgent'
                            ? 'text-red-700 bg-red-50 border-red-200'
                            : 'text-green-700 bg-green-50 border-green-200'}`}>
                          {item.priority}
                        </span>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <span className="block text-sm font-semibold text-gray-700">Provider Notes</span>
                      <div className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap">
                        {item.additional_instructions || item.notes || "—"}
                      </div>
                    </div>

                  </div>
                  {actionButtons}
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Bottom Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
        <button
          onClick={openBatchModal}
          disabled={!editableOrders.length}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-4 py-2 rounded-md disabled:opacity-50 transition-colors shadow-sm"
        >
          Post All Orders
        </button>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium h-10 px-4 py-2 rounded-md transition-colors shadow-sm"
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 px-4 py-2 rounded-md transition-colors shadow-sm"
            >
              Save Orders
            </button>

            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium h-10 px-4 py-2 rounded-md transition-colors shadow-sm"
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

export default OrdersSection