import { calculateVbcPatientOutput, isVbcPatientRecord } from "./vbcCareCalculator";

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeToken = (value = "") =>
  String(value).toLowerCase().trim().replace(/[\s_-]/g, "");

const normalizeText = (value = "") => String(value || "").trim();

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const pickFirst = (...values) => values.find(hasValue);

const toTextArray = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value.map((entry) => String(entry || "").trim()).filter(Boolean);
    }
  }
  return [];
};

const isObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getSchemaAppointment = (value = {}) =>
  isObject(value.appointment)
    ? value.appointment
    : isObject(value.appointmentRecord)
    ? value.appointmentRecord
    : isObject(value.appointment_record)
    ? value.appointment_record
    : value;

const getSchemaPatient = (value = {}) =>
  isObject(value.patient)
    ? value.patient
    : isObject(value.patientRecord)
    ? value.patientRecord
    : isObject(value.patient_record)
    ? value.patient_record
    : {};

const getSchemaProvider = (value = {}) =>
  isObject(value.provider)
    ? value.provider
    : isObject(value.doctor)
    ? value.doctor
    : isObject(value.providerRecord)
    ? value.providerRecord
    : isObject(value.provider_record)
    ? value.provider_record
    : {};

const getSchemaPractice = (value = {}) =>
  isObject(value.practice)
    ? value.practice
    : isObject(value.clinic)
    ? value.clinic
    : isObject(value.facility)
    ? value.facility
    : isObject(value.practiceRecord)
    ? value.practiceRecord
    : isObject(value.practice_record)
    ? value.practice_record
    : {};

const getSchemaSnapshot = (value = {}) =>
  isObject(value.snapshot)
    ? value.snapshot
    : isObject(value.patientSnapshot)
    ? value.patientSnapshot
    : isObject(value.patient_snapshot)
    ? value.patient_snapshot
    : isObject(value.vbcPatientSnapshot)
    ? value.vbcPatientSnapshot
    : isObject(value.vbc_patient_snapshot)
    ? value.vbc_patient_snapshot
    : isObject(value.vbcSnapshot)
    ? value.vbcSnapshot
    : isObject(value.vbc_snapshot)
    ? value.vbc_snapshot
    : {};

const getSchemaGapRows = (value = {}) =>
  [
    value.gapsInCare,
    value.gaps_in_care,
    value.gapInstances,
    value.gap_instances,
    value.vbc_gap_instances,
    value.gaps,
  ].find(Array.isArray) || [];

const getSchemaActionRows = (value = {}) =>
  [
    value.nextBestActions,
    value.next_best_actions,
    value.vbc_next_best_actions,
    value.actions,
  ].find(Array.isArray) || [];

const normalizeRiskTier = (value = "") => {
  const token = normalizeToken(value);
  if (token.includes("high")) return "HIGH";
  if (token.includes("medium") || token.includes("moderate")) return "MEDIUM";
  if (token.includes("low")) return "LOW";
  return "";
};

const normalizeGapStatus = (value = "") => {
  const token = normalizeToken(value);
  if (
    ["closed", "addressed", "complete", "completed", "met", "resolved"].some((status) =>
      token.includes(status)
    )
  ) {
    return "CLOSED";
  }
  if (
    ["open", "notmet", "pending", "due", "overdue", "missed"].some((status) =>
      token.includes(status)
    )
  ) {
    return "OPEN";
  }
  return "";
};

const toGapBadgeLabel = (...values) => {
  const combined = normalizeToken(values.filter(hasValue).join(" "));
  if (!combined) return "";

  if (combined.includes("a1c") || combined.includes("hba1c")) return "A1c";
  if (combined.includes("bloodpressure") || combined === "bp") return "BP";
  if (
    combined.includes("statin") ||
    combined.includes("ldl") ||
    combined.includes("lipid")
  ) {
    return "LDL";
  }
  if (combined.includes("medication") || combined.includes("meds")) return "Meds";
  if (combined.includes("eye")) return "Eye";
  if (combined.includes("foot")) return "Foot";
  if (combined.includes("renal") || combined.includes("kidney")) return "Renal";
  if (combined.includes("depression") || combined.includes("phq")) return "PHQ9";
  if (combined.includes("visitfrequency") || combined.includes("continuity")) return "Visit";

  const rawLabel = normalizeText(pickFirst(...values));
  if (!rawLabel) return "";
  return rawLabel.length > 12 ? `${rawLabel.slice(0, 12)}...` : rawLabel;
};

const extractGapEvidence = (gap = {}) =>
  normalizeText(
    pickFirst(
      gap.evidence,
      gap.evidence_text,
      gap.reason,
      gap.reason_text,
      gap.rationale,
      gap.notes,
      gap.description,
      gap.closed_reason
    )
  );

const extractGapLabel = (gap = {}) =>
  normalizeText(
    pickFirst(
      gap.measure,
      gap.measure_key,
      gap.gap_label,
      gap.label,
      gap.name,
      gap.title,
      "Unknown gap"
    )
  );

const extractGapDueDate = (gap = {}) => {
  const rawDate = pickFirst(gap.dueDate, gap.due_date, gap.dueOn);
  return hasValue(rawDate) ? String(rawDate).slice(0, 10) : null;
};

const normalizeGapForUi = (gap = {}) => ({
  label: extractGapLabel(gap),
  evidence: extractGapEvidence(gap),
  dueDate: extractGapDueDate(gap),
});

const extractFollowUpAction = (action = {}) => ({
  label: normalizeText(
    pickFirst(
      action.action,
      action.action_label,
      action.label,
      action.name,
      "Follow-up action"
    )
  ),
  priority: normalizeText(pickFirst(action.priority, "MEDIUM")).toUpperCase(),
  reason: normalizeText(
    pickFirst(action.reason, action.reason_text, action.evidence, action.notes)
  ),
  owner: normalizeText(pickFirst(action.owner, action.assignedTo, action.assigned_to)),
  dueDate: extractGapDueDate(action),
});

const buildAgentOutputFromSchema = (value = {}) => {
  if (!isObject(value)) return null;

  const snapshot = getSchemaSnapshot(value);
  const gapRows = getSchemaGapRows(value);
  const actionRows = getSchemaActionRows(value);
  const patient = getSchemaPatient(value);
  const practice = getSchemaPractice(value);

  const riskTier = normalizeRiskTier(
    pickFirst(value.risk?.tier, value.risk_tier, snapshot.risk_tier, snapshot.riskTier)
  );
  const riskScore = toNumber(
    pickFirst(value.risk?.score, value.risk_score, snapshot.risk_score, snapshot.riskScore),
    Number.NaN
  );
  const riskDrivers = toTextArray(
    value.risk?.drivers,
    value.riskDrivers,
    value.risk_drivers,
    snapshot.riskDrivers,
    snapshot.risk_drivers,
    snapshot.risk_drivers_json
  );
  const clinicalRationale = normalizeText(
    pickFirst(
      value.clinicalRationale,
      value.clinical_rationale,
      snapshot.clinical_rationale,
      snapshot.clinicalRationale
    )
  );

  if (
    !riskTier &&
    !Number.isFinite(riskScore) &&
    gapRows.length === 0 &&
    actionRows.length === 0 &&
    !clinicalRationale
  ) {
    return null;
  }

  return {
    patientID: normalizeText(
      pickFirst(value.patientID, value.patient_id, patient.id, snapshot.patient_id)
    ),
    practiceID: normalizeText(
      pickFirst(value.practiceID, value.practice_id, practice.id, snapshot.practice_id)
    ),
    risk: {
      tier: riskTier || "LOW",
      score: Number.isFinite(riskScore) ? riskScore : 0,
      drivers: riskDrivers,
    },
    gapsInCare: gapRows.map((gap) => ({
      measure: extractGapLabel(gap),
      status: normalizeText(pickFirst(gap.status, "open")) || "open",
      evidence: extractGapEvidence(gap),
      dueDate: extractGapDueDate(gap),
      priority: normalizeText(pickFirst(gap.priority, "")),
      badge: normalizeText(pickFirst(gap.badge, toGapBadgeLabel(extractGapLabel(gap)))),
    })),
    qualityMeasures: Array.isArray(value.qualityMeasures)
      ? value.qualityMeasures
      : Array.isArray(value.quality_measures)
      ? value.quality_measures
      : [],
    nextBestActions: actionRows.map(extractFollowUpAction),
    clinicalRationale,
  };
};

export const isFabricAgentOutput = (value = {}) => {
  if (!isObject(value)) return false;
  const hasRisk = isObject(value.risk);
  const hasVbcArrays =
    Array.isArray(value.gapsInCare) ||
    Array.isArray(value.qualityMeasures) ||
    Array.isArray(value.nextBestActions);
  return hasRisk && hasVbcArrays;
};

export const extractFabricAgentOutput = (value = {}) => {
  if (!isObject(value) && !Array.isArray(value)) return null;

  const root = isObject(value?.data) ? value.data : value;
  if (isFabricAgentOutput(root)) return root;
  if (isVbcPatientRecord(root)) return calculateVbcPatientOutput(root);
  const schemaRoot = buildAgentOutputFromSchema(root);
  if (schemaRoot) return schemaRoot;

  const candidates = [
    root?.vbc,
    root?.analysis,
    root?.agentOutput,
    root?.agent_output,
    root?.fabricOutput,
    root?.fabric_output,
    root?.vbcOutput,
    root?.vbc_output,
    root?.patientVbc,
    root?.patient_vbc,
    root?.patientAnalysis,
    root?.patient_analysis,
    root?.patient,
    root?.record,
  ];

  for (const candidate of candidates) {
    if (isFabricAgentOutput(candidate)) return candidate;
    if (isVbcPatientRecord(candidate)) return calculateVbcPatientOutput(candidate);
    const schemaCandidate = buildAgentOutputFromSchema(candidate);
    if (schemaCandidate) return schemaCandidate;
  }

  return null;
};

const extractAppointmentContext = (source = {}, agentOutput = {}, index = 0) => {
  const appointment = getSchemaAppointment(source);
  const patient = getSchemaPatient(source);
  const provider = getSchemaProvider(source);
  const practice = getSchemaPractice(source);
  const patientName =
    normalizeText(
      pickFirst(
        source.patientName,
        source.patient_name,
        source.full_name,
        source.name,
        source.patient?.name,
        patient.full_name,
        patient.name,
        [patient.first_name, patient.last_name].filter(hasValue).join(" ").trim()
      )
    ) || "Unknown";

  const clinicId = normalizeText(
    pickFirst(
      source.clinicId,
      source.clinic_id,
      source.practiceID,
      source.practiceId,
      source.practice?.id,
      practice.id,
      appointment.practice_id,
      provider.practice_id,
      patient.practice_id,
      agentOutput.practiceID
    )
  );

  return {
    id: String(
      pickFirst(
        source.id,
        source.appointmentId,
        source.appointment_id,
        appointment.id,
        appointment.appointment_id,
        appointment.athena_appointment_id,
        source.callId,
        source.encounterId,
        agentOutput.patientID,
        index + 1
      )
    ),
    patientName,
    appointmentDate: normalizeText(
      pickFirst(
        source.appointmentDate,
        source.appointment_date,
        appointment.appointmentDate,
        appointment.appointment_date,
        source.date
      )
    ),
    appointmentTime: normalizeText(
      pickFirst(
        source.appointmentTime,
        source.time,
        appointment.appointmentTime,
        appointment.appointment_time,
        appointment.time
      )
    ),
    type: normalizeText(
      pickFirst(
        source.type,
        source.appointmentType,
        source.appointment_type,
        appointment.type,
        appointment.appointment_type,
        "unknown"
      )
    ),
    status: normalizeText(pickFirst(source.status, appointment.status, "scheduled")),
    doctorId: normalizeText(
      pickFirst(
        source.doctorId,
        source.doctor_id,
        source.providerId,
        source.provider_id,
        provider.id,
        provider.provider_id
      )
    ),
    doctorEmail: normalizeEmail(
      pickFirst(
        source.doctorEmail,
        source.doctor_email,
        source.providerEmail,
        source.provider_email,
        source.userID,
        source.userId,
        provider.doctor_email,
        provider.provider_email,
        provider.email
      )
    ),
    doctorName: normalizeText(
      pickFirst(
        source.doctorName,
        source.doctor_name,
        source.providerName,
        source.provider_name,
        provider.doctor_name,
        provider.provider_name,
        provider.name,
        [provider.first_name, provider.last_name].filter(hasValue).join(" ").trim()
      )
    ),
    clinicId,
    clinicName:
      normalizeText(
        pickFirst(
          source.clinicName,
          source.clinic_name,
          source.practiceName,
          source.practice_name,
          source.practice?.name,
          source.facilityName,
          source.facility_name,
          practice.display_name,
          practice.name
        )
      ) || clinicId,
  };
};

const toPriorityTier = (agentOutput = {}) => {
  const token = normalizeToken(agentOutput?.risk?.tier);
  if (token.includes("high")) return "high";
  if (token.includes("medium")) return "medium";
  return "low";
};

const getOpenGaps = (agentOutput = {}) =>
  (Array.isArray(agentOutput.gapsInCare) ? agentOutput.gapsInCare : []).filter((gap) => {
    const status = normalizeGapStatus(gap?.status);
    return status ? status === "OPEN" : true;
  });

const getClosedGaps = (agentOutput = {}) =>
  (Array.isArray(agentOutput.gapsInCare) ? agentOutput.gapsInCare : []).filter(
    (gap) => normalizeGapStatus(gap?.status) === "CLOSED"
  );

const toSummaryRowFromFabric = (source = {}, index = 0) => {
  const agentOutput = extractFabricAgentOutput(source);
  if (!agentOutput) return null;

  const openGaps = getOpenGaps(agentOutput);
  const addressedGaps = getClosedGaps(agentOutput);
  const gapBadges = Array.from(
    new Set(
      openGaps
        .map((gap) => toGapBadgeLabel(extractGapLabel(gap), extractGapEvidence(gap)))
        .filter(Boolean)
    )
  ).slice(0, 4);

  return {
    ...extractAppointmentContext(source, agentOutput, index),
    totalGapCount: openGaps.length + addressedGaps.length,
    addressedGapCount: addressedGaps.length,
    openGapCount: openGaps.length,
    gapBadges,
    priority: toPriorityTier(agentOutput),
    riskScore: toNumber(agentOutput?.risk?.score),
    riskDrivers: Array.isArray(agentOutput?.risk?.drivers)
      ? agentOutput.risk.drivers.filter(hasValue)
      : [],
    qualityMeasures: Array.isArray(agentOutput?.qualityMeasures)
      ? agentOutput.qualityMeasures
      : [],
    gapsInCare: Array.isArray(agentOutput?.gapsInCare) ? agentOutput.gapsInCare : [],
    nextBestActions: Array.isArray(agentOutput?.nextBestActions)
      ? agentOutput.nextBestActions.map(extractFollowUpAction)
      : [],
    clinicalRationale: normalizeText(agentOutput?.clinicalRationale),
  };
};

export const tryMapFabricSummaryRows = (payload = {}) => {
  const candidateArrays = [];

  if (Array.isArray(payload)) {
    candidateArrays.push(payload);
  } else if (isObject(payload)) {
    [
      payload.appointments,
      payload.rows,
      payload.data,
      payload.outputs,
      payload.patientOutputs,
      payload.patients,
      payload.records,
    ].forEach((candidate) => {
      if (Array.isArray(candidate)) candidateArrays.push(candidate);
    });
  }

  for (const array of candidateArrays) {
    const mappedRows = array
      .map((item, index) => toSummaryRowFromFabric(item, index))
      .filter(Boolean);
    if (mappedRows.length > 0) return mappedRows;
  }

  const singleRow = toSummaryRowFromFabric(payload, 0);
  return singleRow ? [singleRow] : null;
};

export const tryNormalizeFabricPostCallPayload = (payload = {}) => {
  const agentOutput = extractFabricAgentOutput(payload);
  if (!agentOutput) return null;

  const openGaps = getOpenGaps(agentOutput).map(normalizeGapForUi);
  const addressedGaps = getClosedGaps(agentOutput).map(normalizeGapForUi);
  const totalGaps = openGaps.length + addressedGaps.length;

  return {
    addressedGaps,
    missedGaps: openGaps,
    followUpActions: Array.isArray(agentOutput?.nextBestActions)
      ? agentOutput.nextBestActions.map(extractFollowUpAction)
      : [],
    closureRate: totalGaps > 0 ? Math.round((addressedGaps.length / totalGaps) * 100) : null,
    notes: normalizeText(agentOutput?.clinicalRationale),
  };
};
