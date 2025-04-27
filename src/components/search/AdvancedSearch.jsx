import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

function AdvancedSearch() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      <div>
        <Label>Date of Birth</Label>
        <Input type="date" />
      </div>
      <div>
        <Label>Insurance Provider</Label>
        <Input placeholder="Enter insurance provider..." />
      </div>
      <div>
        <Label>Insurance ID</Label>
        <Input placeholder="Enter insurance ID..." />
      </div>
      <div>
        <Label>Phone Number</Label>
        <Input placeholder="Enter phone number..." />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" placeholder="Enter email..." />
      </div>
      <div>
        <Label>SSN</Label>
        <Input placeholder="Enter SSN..." />
      </div>
      <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2">
        <Button variant="outline">Reset</Button>
        <Button>Search</Button>
      </div>
    </div>
  );
}

export default AdvancedSearch;
