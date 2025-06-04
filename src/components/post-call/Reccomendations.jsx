import { useQuery } from "@tanstack/react-query";
import { fetchRecommendationByAppointment } from "../../api/recommendations";
import ReactMarkdown from 'react-markdown';
import { useSelector } from "react-redux";

const Reccomendations = ({ appointmentId }) => {
    const username = useSelector((state) => state.me.me.name)
    const { data: reccomendations } = useQuery({
        queryKey: "recommendations",
        queryFn: () => fetchRecommendationByAppointment(`${username}_${appointmentId}_recommendations`, username)
    })
    return (
        <div>
            <ReactMarkdown>{reccomendations && reccomendations.data.recommendations.replaceAll("# ","#") }</ReactMarkdown>
        </div>
    )
}

export default Reccomendations