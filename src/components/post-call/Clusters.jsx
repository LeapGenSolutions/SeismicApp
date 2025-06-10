import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query"
import { fetchClustersByAppointment } from "../../api/clusters";
import { useSelector } from "react-redux";

//  Original clustered data (not deeply nested, still simple)


const Clusters = ({appointmentId}) => {
  const username = useSelector((state) => state.me.me.name);
  const { data } = useQuery({
    queryKey: "clusters",
    queryFn: ()=>fetchClustersByAppointment(`${username}_${appointmentId}_clusters`, username),
  })
  const [clusteredData, setClusterData] = useState([])
  useEffect(()=>{
    if(data?.data?.clustered_output){
      setClusterData(data.data.clustered_output)
    }
  },[data])
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Clusters Information</h1>

      {clusteredData.map((item, index) => (
        <div
          key={index}
          className="p-4 border border-gray-300 rounded-xl shadow-sm bg-white"
        >
          <h2 className="text-lg font-bold mb-1">Topic: {item.topic}</h2>
          <p className="text-sm text-gray-600 mb-2">
            SOAP Section: {item.soap_section}
          </p>
          <ul className="list-disc ml-6 space-y-1">
            {item.lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Clusters
