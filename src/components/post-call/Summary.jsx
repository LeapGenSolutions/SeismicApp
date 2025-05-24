import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react"
import { fetchSummaryByAppointment } from "../../api/summary";
import { useEffect, useState } from "react";

const Summary = ({
    propFormatRecordingTime,
    propRecordingTime
}) => {

    const patient = {}
    const selectedAppointment = {}
    const recordingTime = propRecordingTime || 0;

    const formatRecordingTime =
        propFormatRecordingTime ||
        ((s) => {
            const min = Math.floor(s / 60).toString().padStart(2, "0");
            const sec = (s % 60).toString().padStart(2, "0");
            return `${min}:${sec}`;
        });

    const { data, isLoading, error } = useQuery({
        queryKey: "summary",
        queryFn: () => fetchSummaryByAppointment('test_test1_summary', 'test')
    })

    const [summary, setSummary] = useState("")

    useEffect(() => {
        if (!isLoading && data) {
            setSummary(data.data.full_summary_text)
        }
    }, [data, isLoading])

    if(error){
        return <div>Unable to fetch Summary....!!</div>
    }

    return (
        <div className="bg-blue-50 border border-blue-200 rounded p-6">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2" /> Call Summary
            </h3>
            <div className="text-sm text-neutral-700">
                <p className="mb-2"><span className="font-bold">Patient:</span> {patient?.firstName} {patient?.lastName}</p>
                <p className="mb-2"><span className="font-bold">Date & Time:</span> {new Date().toLocaleString()}</p>
                <p className="mb-2"><span className="font-bold">Duration:</span> {formatRecordingTime(recordingTime)}</p>
                <p className="mb-2"><span className="font-bold">Reason for Visit:</span> {selectedAppointment?.reason}</p>
                <p className="mb-2"><span className="font-bold">Summary from AI:<br /></span> {summary}</p>
            </div>
        </div>
    )
}

export default Summary