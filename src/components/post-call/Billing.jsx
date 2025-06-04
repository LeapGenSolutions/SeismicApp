import { fetchBillingByAppointment } from "../../api/billingcodes";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import ReactMarkdown from 'react-markdown';



const Billing = ({ appointmentId }) => {
  const username = useSelector((state) => state.me.me.name)
  const { data } = useQuery({
    queryKey: "billing-codes",
    queryFn: () => fetchBillingByAppointment(`${username}_${appointmentId}_billing`, username)
  })
  return (
    <div className="prose max-w-none">
      <ReactMarkdown>{data && data.data.billing_codes}</ReactMarkdown>
    </div>
  );
}

export default Billing