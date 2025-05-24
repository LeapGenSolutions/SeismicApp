import React, { useState } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";



const Billing = () => {
    const [billing, setBilling] = useState({ cpt: "", icd: "", notes: "" });
    const [billingModifiers, setBillingModifiers] = useState([]);
    return (
        <div>
            <h3 className="font-medium text-lg mb-4">Billing Codes</h3>
            <Label>CPT Codes</Label>
            <Select value={billing.cpt} onValueChange={val => setBilling({ ...billing, cpt: val })}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select CPT code" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="99213">99213 - Office/outpatient visit</SelectItem>
                    <SelectItem value="99214">99214 - Office/outpatient visit, moderate</SelectItem>
                </SelectContent>
            </Select>

            <Label className="mt-4">ICD-10 Codes</Label>
            <Select value={billing.icd} onValueChange={val => setBilling({ ...billing, icd: val })}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select ICD-10 code" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="E11.9">E11.9 - Type 2 diabetes mellitus</SelectItem>
                    <SelectItem value="I10">I10 - Hypertension</SelectItem>
                </SelectContent>
            </Select>

            <Label className="mt-4">Modifiers</Label>
            <div className="flex gap-2 mt-2">
                {['95 - Telehealth', 'GT - Telemedicine', 'GQ - Store and Forward'].map(mod => (
                    <Button
                        key={mod}
                        variant={billingModifiers.includes(mod) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setBillingModifiers(
                            billingModifiers.includes(mod)
                                ? billingModifiers.filter(m => m !== mod)
                                : [...billingModifiers, mod]
                        )}
                    >
                        {mod}
                    </Button>
                ))}
            </div>

            <Label className="mt-4">Billing Notes</Label>
            <Textarea
                className="mt-1"
                placeholder="Additional billing notes..."
                value={billing.notes}
                onChange={e => setBilling({ ...billing, notes: e.target.value })}
            />

            <div className="flex justify-between mt-4">
                <Button variant="outline">Verify Codes</Button>
                <div className="space-x-2">
                    <Button variant="outline">Clear All</Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">Submit for Billing</Button>
                </div>
            </div>
        </div>
    )
}

export default Billing