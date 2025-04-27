import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { useToast } from "../../hooks/use-toast";
import { Video, User } from "lucide-react";
import { format } from "date-fns";

const AppointmentDetails = ({ appointmentId, onStartVideoCall }) => {
  const [newNote, setNewNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointment, isLoading: isAppointmentLoading } = useQuery({
    queryKey: ["appointment", appointmentId],
    enabled: !!appointmentId,
  });

  const { data: patient, isLoading: isPatientLoading } = useQuery({
    queryKey: ["patient", appointment?.patientId],
    enabled: !!appointment?.patientId,
  });

  const { data: provider, isLoading: isProviderLoading } = useQuery({
    queryKey: ["provider", appointment?.providerId],
    enabled: !!appointment?.providerId,
  });

  const { data: clinicalNotes, isLoading: isClinicalNotesLoading } = useQuery({
    queryKey: ["clinicalNotes", appointmentId],
    enabled: !!appointmentId,
  });

  const saveClinicalNoteMutation = useMutation({
    mutationFn: async (noteData) => {
      const res = await apiRequest("POST", "/api/clinical-notes", noteData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Clinical note saved successfully",
      });
      setNewNote("");
      queryClient.invalidateQueries({
        queryKey: ["clinicalNotes", appointmentId],
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save clinical note",
        variant: "destructive",
      });
    },
  });

  const handleSaveNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Error",
        description: "Note cannot be empty",
        variant: "destructive",
      });
      return;
    }

    saveClinicalNoteMutation.mutate({
      appointmentId,
      providerId: provider?.id,
      content: newNote,
      createdAt: new Date().toISOString(),
    });
  };

  const isLoading =
    isAppointmentLoading ||
    isPatientLoading ||
    isProviderLoading ||
    isClinicalNotesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!appointment || !patient || !provider) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-lg font-medium">No appointment selected</p>
            <p className="text-sm text-gray-500">
              Please select an appointment from the calendar to view details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Appointment Details</CardTitle>
          <div className="flex gap-2">
            {appointment.method === "video" && (
              <Button onClick={onStartVideoCall}>Start Video Call</Button>
            )}
            <Button variant="outline">Reschedule</Button>
            <Button variant="destructive">Cancel</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-4">Patient Information</h3>
              <div className="flex items-start">
                {patient.profileImage ? (
                  <img
                    src={patient.profileImage}
                    alt={`${patient.firstName} ${patient.lastName}`}
                    className="w-20 h-20 rounded-md object-cover mr-4"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-md bg-neutral-200 flex items-center justify-center mr-4">
                    <span className="text-lg font-medium">
                      {patient.firstName?.charAt(0)}
                      {patient.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-gray-500">Patient ID</p>
                      <p className="font-medium">{patient.patientId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">
                        {patient.dob
                          ? format(new Date(patient.dob), "MM/dd/yyyy")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{patient.phone || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{patient.email || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Badge
                  variant={patient.insuranceVerified ? "success" : "warning"}
                >
                  Insurance {patient.insuranceVerified ? "Verified" : "Pending"}
                </Badge>
                <Badge variant={patient.formsCompleted ? "success" : "warning"}>
                  Forms {patient.formsCompleted ? "Completed" : "Pending"}
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-4">Appointment Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Appointment ID</p>
                  <p className="font-medium">{appointment.appointmentId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(appointment.date), "MMMM d, yyyy")} -{" "}
                    {appointment.time}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="font-medium">
                    {provider.fullName} ({provider.specialty})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{appointment.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    variant={
                      appointment.status === "confirmed" ? "success" : "warning"
                    }
                  >
                    {appointment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visit Method</p>
                  <div className="flex items-center">
                    {appointment.method === "video" ? (
                      <>
                        <Video className="w-4 h-4 mr-1 text-success-500" />
                        <span>Video Call</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-1 text-success-500" />
                        <span>In-Person</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-2">Reason for Visit</h3>
            <p className="text-gray-700">
              {appointment.reason || "No reason provided"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clinical Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clinicalNotes?.map((note) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{note.providerName}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            ))}

            <div className="mt-4">
              <Textarea
                placeholder="Add a new clinical note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[100px]"
              />
              <Button
                onClick={handleSaveNote}
                className="mt-2"
                disabled={saveClinicalNoteMutation.isLoading}
              >
                {saveClinicalNoteMutation.isLoading ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppointmentDetails;
