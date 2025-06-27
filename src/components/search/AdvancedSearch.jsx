import { Label } from "../ui/label";
import { Input } from "../ui/input";

function AdvancedSearch({ filters = {}, setFilters = () => {} }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      <div>
        <Label>Date of Birth</Label>
        <Input
          type="date"
          value={
            filters.dateOfBirth
              ? new Date(filters.dateOfBirth).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) =>
            setFilters({ ...filters, dateOfBirth: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Insurance Provider</Label>
        <Input
          placeholder="Enter insurance provider..."
          value={filters.insuranceProvider || ""}
          onChange={(e) =>
            setFilters({ ...filters, insuranceProvider: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Insurance ID</Label>
        <Input
          placeholder="Enter insurance ID..."
          value={filters.insuranceId || ""}
          onChange={(e) =>
            setFilters({ ...filters, insuranceId: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Phone Number</Label>
        <Input
          placeholder="Enter phone number..."
          value={filters.phoneNumber || ""}
          onChange={(e) =>
            setFilters({ ...filters, phoneNumber: e.target.value })
          }
        />
      </div>

      <div>
        <Label>Email</Label>
        <Input
          type="email"
          placeholder="Enter email..."
          value={filters.email || ""}
          onChange={(e) =>
            setFilters({ ...filters, email: e.target.value })
          }
        />
      </div>
    </div>
  );
}

export default AdvancedSearch;
