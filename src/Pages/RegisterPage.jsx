import { useEffect, useState, useRef } from "react";
import { navigate } from "wouter/use-browser-location";
import Logo from "../assets/Logo";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { BACKEND_URL } from "../constants";

// US States list
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming"
];

// Helper to safely decode a JWT without validating it (backend must still verify)
const decodeIdToken = (token) => {
  try {
    const [, payloadBase64] = token.split(".");
    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = atob(normalized);
    return JSON.parse(payloadJson);
  } catch (error) {
    console.error("Failed to decode CIAM token", error);
    return null;
  }
};

// Initial form data structure
const initialFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  primaryEmail: "",
  secondaryEmail: "",
  role: "",
  npiNumber: "",
  specialty: "",
  subSpecialty: "",
  statesOfLicense: "",
  licenseNumber: "",
  clinicName: "",
  practiceAddress: {
    street: "",
    city: "",
    state: "",
    zip: "",
  },
};

// Initial errors structure
const initialErrors = {
  firstName: "",
  lastName: "",
  primaryEmail: "",
  secondaryEmail: "",
  role: "",
  npiNumber: "",
  specialty: "",
  statesOfLicense: "",
  clinicName: "",
  practiceAddress: {
    street: "",
    city: "",
    state: "",
    zip: "",
  },
  terms: "",
};

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [signupType, setSignupType] = useState("standalone"); // "standalone" or "clinic"
  const [isNpiVerified, setIsNpiVerified] = useState(false);
  const [isVerifyingNpi, setIsVerifyingNpi] = useState(false);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState(initialErrors);

  useEffect(() => {
    document.title = "Register - Seismic Connect";

    // CIAM redirects here with id_token in the URL hash: #id_token=...
    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.substring(1)
      : "";
    const params = new URLSearchParams(hash);

    let idToken = params.get("id_token");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    // If no token in URL (e.g. page refresh), fall back to sessionStorage
    if (!idToken) {
      idToken = sessionStorage.getItem("ciamIdToken");
    }

    if (idToken) {
      const payload = decodeIdToken(idToken);
      if (!payload) {
        setErrors((prev) => ({
          ...prev,
          general: "Invalid token. Please try logging in again.",
        }));
        return;
      }

      const email = payload.email || payload.emails?.[0] || "";
      const userId = payload.sub || payload.oid || "";

      // Store token + auth metadata
      sessionStorage.setItem("ciamIdToken", idToken);
      sessionStorage.setItem("authType", "ciam");
      sessionStorage.setItem("authIntent", "standalone");

      // Pre-fill email
      if (email) {
        setFormData((prev) => ({ ...prev, primaryEmail: email }));
      }

      // Check if token came from URL (not from sessionStorage on refresh)
      const tokenFromUrl = params.get("id_token");
      
      // Verify email/token when token comes from CIAM redirect (not from refresh)
      if (tokenFromUrl) {
        // Verify token and user (email verification)
        fetch(`${BACKEND_URL}api/standalone/auth/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken,
            email,
            userId,
          }),
        })
          .then((res) => {
            if (!res.ok) {
              throw new Error(`Verification failed: ${res.status}`);
            }
            return res.json();
          })
          .then((data) => {
            // Email verified - check if this is first time user
            if (data.isFirstTime === true) {
              // First time user - navigate to dashboard
              // Remove hash from URL before navigating
              if (window.history && window.history.replaceState) {
                window.history.replaceState(
                  null,
                  document.title,
                  window.location.pathname + window.location.search
                );
              }
              navigate("/");
            } else {
              // Not first time - user can proceed with registration
              // Keep hash in URL for page refresh support
              // Hash will be removed after successful registration
            }
          })
          .catch((err) => {
            console.error("Token verification failed:", err);
            setErrors((prev) => ({
              ...prev,
              general: "Token verification failed. Please try logging in again.",
            }));
          });
      }
    } else if (error) {
      // CIAM reported an error instead of returning a token
      console.error("CIAM login error:", error, errorDescription);
      setErrors((prev) => ({
        ...prev,
        general: errorDescription || error || "Login failed. Please try again.",
      }));
    }
  }, []);

  // Clear all fields except email when signup type changes
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Clear all fields except email
    setFormData((prev) => ({
      ...initialFormData,
      primaryEmail: prev.primaryEmail, // Keep the email
    }));

    // Clear all errors
    setErrors(initialErrors);
    
    // Reset terms checkbox
    setAgreeToTerms(false);
    
    // Reset NPI verification status
    setIsNpiVerified(false);
    setIsVerifyingNpi(false);
  }, [signupType]);

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Name validation (letters, spaces, hyphens only)
  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    return nameRegex.test(name) && name.trim().length > 0;
  };

  // NPI Number validation (10 digits)
  const validateNPI = (npi) => {
    const npiRegex = /^\d{10}$/;
    return npiRegex.test(npi);
  };

  // Handle input changes with validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when typing
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Handle numeric input for NPI and License Number (only allow numbers)
  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    // Only allow numbers
    const numericValue = value.replace(/\D/g, '');
    
    // If NPI number changes, reset verification status
    if (name === "npiNumber" && numericValue !== formData.npiNumber) {
      setIsNpiVerified(false);
    }
    
    setFormData(prev => ({ ...prev, [name]: numericValue }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // Validate fields on blur
  const handleFirstNameBlur = () => {
    if (formData.firstName && !validateName(formData.firstName)) {
      setErrors(prev => ({ ...prev, firstName: "Please enter a valid first name" }));
    }
  };

  const handleLastNameBlur = () => {
    if (formData.lastName && !validateName(formData.lastName)) {
      setErrors(prev => ({ ...prev, lastName: "Please enter a valid last name" }));
    }
  };

  const handlePrimaryEmailBlur = () => {
    if (formData.primaryEmail && !validateEmail(formData.primaryEmail)) {
      setErrors(prev => ({ ...prev, primaryEmail: "Please enter a valid email address" }));
    }
  };

  const handleSecondaryEmailBlur = () => {
    if (formData.secondaryEmail && !validateEmail(formData.secondaryEmail)) {
      setErrors(prev => ({ ...prev, secondaryEmail: "Please enter a valid email address" }));
    }
  };

  const handleNPIBlur = async () => {
    // Validate format first
    if (formData.npiNumber && !validateNPI(formData.npiNumber)) {
      setErrors(prev => ({ ...prev, npiNumber: "NPI must be exactly 10 digits" }));
      setIsNpiVerified(false);
      return;
    }

    // If NPI is valid and not yet verified, call verify API
    if (formData.npiNumber && validateNPI(formData.npiNumber) && !isNpiVerified) {
      setIsVerifyingNpi(true);
      setErrors(prev => ({ ...prev, npiNumber: "" }));

      try {
        const response = await fetch(`${BACKEND_URL}api/verify-npi`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            npiNumber: formData.npiNumber,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || "NPI verification failed";
          setErrors(prev => ({ ...prev, npiNumber: errorMessage }));
          setIsNpiVerified(false);
        } else {
          // NPI verified successfully
          setIsNpiVerified(true);
          setErrors(prev => ({ ...prev, npiNumber: "" }));
        }
      } catch (error) {
        console.error("NPI verification error:", error);
        setErrors(prev => ({ 
          ...prev, 
          npiNumber: error.message || "Failed to verify NPI. Please try again." 
        }));
        setIsNpiVerified(false);
      } finally {
        setIsVerifyingNpi(false);
      }
    } else if (formData.npiNumber && validateNPI(formData.npiNumber)) {
      // Clear error if format is valid
      setErrors(prev => ({ ...prev, npiNumber: "" }));
    }
  };

  const handleZipCodeBlur = () => {
    // Validate zip code format (exactly 5 digits)
    if (formData.practiceAddress.zip) {
      if (formData.practiceAddress.zip.length !== 5) {
        setErrors(prev => ({
          ...prev,
          practiceAddress: {
            ...prev.practiceAddress,
            zip: "Zip code must be exactly 5 digits"
          }
        }));
      } else if (!/^\d{5}$/.test(formData.practiceAddress.zip)) {
        setErrors(prev => ({
          ...prev,
          practiceAddress: {
            ...prev.practiceAddress,
            zip: "Zip code must contain only numbers"
          }
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          practiceAddress: {
            ...prev.practiceAddress,
            zip: ""
          }
        }));
      }
    }
  };

  // Handle practice address field changes
  const handlePracticeAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      practiceAddress: {
        ...prev.practiceAddress,
        [field]: value
      }
    }));
    setErrors(prev => ({
      ...prev,
      practiceAddress: {
        ...prev.practiceAddress,
        [field]: ""
      }
    }));
  };



  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    const newErrors = { ...initialErrors };
    
    let hasError = false;

    // Validate mandatory fields
    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
      hasError = true;
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = "Please enter a valid first name";
      hasError = true;
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
      hasError = true;
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = "Please enter a valid last name";
      hasError = true;
    }

    if (!formData.primaryEmail) {
      newErrors.primaryEmail = "Primary email is required";
      hasError = true;
    } else if (!validateEmail(formData.primaryEmail)) {
      newErrors.primaryEmail = "Please enter a valid email address";
      hasError = true;
    }

    // Validate secondary email if provided
    if (formData.secondaryEmail && !validateEmail(formData.secondaryEmail)) {
      newErrors.secondaryEmail = "Please enter a valid email address";
      hasError = true;
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
      hasError = true;
    }

    if (!formData.npiNumber) {
      newErrors.npiNumber = "NPI number is required";
      hasError = true;
    } else if (!validateNPI(formData.npiNumber)) {
      newErrors.npiNumber = "NPI must be exactly 10 digits";
      hasError = true;
    } else if (!isNpiVerified) {
      newErrors.npiNumber = "Please verify your NPI number before submitting";
      hasError = true;
    }

    if (!formData.specialty) {
      newErrors.specialty = "Specialty is required";
      hasError = true;
    }

    if (!formData.statesOfLicense || formData.statesOfLicense.trim() === "") {
      newErrors.statesOfLicense = "State of license is required";
      hasError = true;
    }

    // Validate clinic fields for clinic signup type
    if (signupType === "clinic") {
      if (!formData.clinicName) {
        newErrors.clinicName = "Clinic/Practice name is required";
        hasError = true;
      }
      if (!formData.practiceAddress.street) {
        newErrors.practiceAddress.street = "Street address is required";
        hasError = true;
      }
      if (!formData.practiceAddress.city) {
        newErrors.practiceAddress.city = "City is required";
        hasError = true;
      }
      if (!formData.practiceAddress.state) {
        newErrors.practiceAddress.state = "State is required";
        hasError = true;
      }
      if (!formData.practiceAddress.zip) {
        newErrors.practiceAddress.zip = "Zip code is required";
        hasError = true;
      } else if (formData.practiceAddress.zip.length !== 5) {
        newErrors.practiceAddress.zip = "Zip code must be exactly 5 digits";
        hasError = true;
      } else if (!/^\d{5}$/.test(formData.practiceAddress.zip)) {
        newErrors.practiceAddress.zip = "Zip code must contain only numbers";
        hasError = true;
      }
    }

    // Validate zip code format if provided (regardless of signup type)
    if (formData.practiceAddress.zip && formData.practiceAddress.zip.length > 0) {
      if (formData.practiceAddress.zip.length !== 5) {
        newErrors.practiceAddress.zip = "Zip code must be exactly 5 digits";
        hasError = true;
      } else if (!/^\d{5}$/.test(formData.practiceAddress.zip)) {
        newErrors.practiceAddress.zip = "Zip code must contain only numbers";
        hasError = true;
      }
    }

    if (!agreeToTerms) {
      newErrors.terms = "You must agree to the terms and conditions";
      hasError = true;
    }

    // Set all errors to display validation messages
    setErrors(newErrors);
    
    // If there are validation errors, stop form submission
    if (hasError) {
      // Scroll to first error field for better UX
      setTimeout(() => {
        const firstErrorField = document.querySelector('.border-red-500');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setIsLoading(true);
    
    try {
      // Get CIAM id_token from session storage
      const ciamToken = sessionStorage.getItem("ciamIdToken");
      
      if (!ciamToken) {
        setErrors((prev) => ({
          ...prev,
          general: "Authentication token not found. Please log in again.",
        }));
        setIsLoading(false);
        return;
      }

      // Prepare practice address - only include if it has at least one field
      let practiceAddressData = null;
      if (signupType === "clinic" || 
          formData.practiceAddress.street || 
          formData.practiceAddress.city || 
          formData.practiceAddress.state || 
          formData.practiceAddress.zip) {
        practiceAddressData = formData.practiceAddress;
      }

      // Prepare request payload
      const payload = {
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        lastName: formData.lastName,
        primaryEmail: formData.primaryEmail,
        secondaryEmail: formData.secondaryEmail || undefined,
        role: formData.role,
        npiNumber: formData.npiNumber,
        specialty: formData.specialty,
        subSpecialty: formData.subSpecialty || undefined,
        statesOfLicense: formData.statesOfLicense,
        licenseNumber: formData.licenseNumber || undefined,
        clinicName: formData.clinicName || undefined,
        practiceAddress: practiceAddressData,
        termsAccepted: agreeToTerms,
        privacyAccepted: agreeToTerms,
        clinicalResponsibilityAccepted: agreeToTerms,
        signupType: signupType,
      };

      // Remove undefined fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });

      // Call /api/standalone/auth/register with registration data
      const response = await fetch(`${BACKEND_URL}api/standalone/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Registration failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Store user data locally
      localStorage.setItem("registrationData", JSON.stringify({
        email: formData.primaryEmail,
        firstName: formData.firstName,
        lastName: formData.lastName,
        userId: data.userId,
      }));

      // Mark registration as complete
      sessionStorage.setItem("standaloneRegistrationComplete", "true");
      
      // Remove hash from URL before navigating
      if (window.history && window.history.replaceState) {
        window.history.replaceState(
          null,
          document.title,
          window.location.pathname + window.location.search
        );
      }
      
      // Navigate to dashboard after successful registration
      navigate("/");
      
    } catch (error) {
      console.error("Registration error:", error);
      setErrors((prev) => ({
        ...prev,
        general: error.message || "Registration failed. Please try again or contact support if the issue persists.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 py-4 overflow-hidden">

      {/* --- Light Overlay Gradient --- */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-white/80 to-blue-50/90 backdrop-blur-sm"></div>

      {/* --- Sign Up Card --- */}
      <div className="relative max-w-5xl w-full bg-white/95 px-8 py-6 rounded-2xl shadow-lg backdrop-blur-md flex flex-col items-center animate-fadeIn z-10">
        {/* Logo */}
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 flex items-center justify-center">
            <Logo size="large" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-[#1E3A8A] mb-1 text-center">
          Register your SEISMIC account
        </h2>
        <p className="mb-4 text-gray-600 text-sm text-center">
          Join our healthcare platform
        </p>

        {/* Registration Type Selection - Pill Shaped (Same as Login Page) */}
        <div className="flex justify-center mb-4">
          <div className="flex gap-2 bg-gray-100 p-1 rounded-full">
            {/* Standalone Radio */}
            <label className="cursor-pointer flex-1 min-w-[180px]">
              <input
                type="radio"
                name="signupType"
                value="standalone"
                checked={signupType === "standalone"}
                onChange={(e) => setSignupType(e.target.value)}
                className="hidden"
              />
              <div className={`px-6 py-2.5 rounded-full text-center text-sm font-medium transition-all ${
                signupType === "standalone"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    signupType === "standalone"
                      ? "border-white bg-white"
                      : "border-gray-400 bg-white"
                  }`}>
                    {signupType === "standalone" && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <span>Standalone</span>
                </div>
              </div>
            </label>

            {/* Clinic Radio */}
            <label className="cursor-pointer flex-1 min-w-[180px]">
              <input
                type="radio"
                name="signupType"
                value="clinic"
                checked={signupType === "clinic"}
                onChange={(e) => setSignupType(e.target.value)}
                className="hidden"
              />
              <div className={`px-6 py-2.5 rounded-full text-center text-sm font-medium transition-all ${
                signupType === "clinic"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    signupType === "clinic"
                      ? "border-white bg-white"
                      : "border-gray-400 bg-white"
                  }`}>
                    {signupType === "clinic" && (
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    )}
                  </div>
                  <span>Clinic / LeapGen</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3" autoComplete="off">
          {/* Personal Information Section */}
          <div className="">
            <h3 className="text-lg font-medium text-[#1E40AF] mb-1">Personal Information</h3>
            
            {/* Row 1: First Name, Middle Name, Last Name */}
            <div className="grid grid-cols-3 gap-3 mb-3">
            {/* First Name */}
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                onBlur={handleFirstNameBlur}
                placeholder="First Name"
                className={`w-full ${errors.firstName ? "border-red-500" : ""}`}
              />
              {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
            </div>

            {/* Middle Name */}
            <div>
              <Label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </Label>
              <Input
                id="middleName"
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                placeholder="Middle Name"
                className="w-full"
              />
            </div>

            {/* Last Name */}
            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name<span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                onBlur={handleLastNameBlur}
                placeholder="Last Name"
                className={`w-full ${errors.lastName ? "border-red-500" : ""}`}
              />
              {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          {/* Row 2: Primary Email, Secondary Email, Role */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Primary Email */}
            <div>
              <Label htmlFor="primaryEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Primary Email<span className="text-red-500">*</span>
              </Label>
              <Input
                id="primaryEmail"
                type="email"
                name="primaryEmail"
                value={formData.primaryEmail}
                readOnly
                disabled
                placeholder="Primary Email"
                className={`w-full bg-gray-50 ${errors.primaryEmail ? "border-red-500" : ""}`}
              />
              {errors.primaryEmail && <p className="mt-1 text-xs text-red-500">{errors.primaryEmail}</p>}
            </div>

            {/* Secondary Email */}
            <div>
              <Label htmlFor="secondaryEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Email
              </Label>
              <Input
                id="secondaryEmail"
                type="email"
                name="secondaryEmail"
                value={formData.secondaryEmail}
                onChange={handleChange}
                onBlur={handleSecondaryEmailBlur}
                placeholder="Secondary Email"
                className={`w-full ${errors.secondaryEmail ? "border-red-500" : ""}`}
              />
              {errors.secondaryEmail && <p className="mt-1 text-xs text-red-500">{errors.secondaryEmail}</p>}
            </div>

            {/* Role */}
            <div className="relative">
              <Label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role<span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, role: value }));
                  setErrors(prev => ({ ...prev, role: "" }));
                }}
              >
                <SelectTrigger
                  className={`w-full ${errors.role ? "border-red-500" : ""}`}
                >
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="Doctor" className="cursor-pointer hover:bg-gray-100">Doctor</SelectItem>
                  <SelectItem value="Nurse Practitioner" className="cursor-pointer hover:bg-gray-100">Nurse Practitioner</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
            </div>
          </div>

          {/* Row 3: NPI Number, Specialty, Sub-specialty */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* NPI Number */}
            <div>
              <Label htmlFor="npiNumber" className="block text-sm font-medium text-gray-700 mb-1">
                NPI Number<span className="text-red-500">*</span>
              </Label>
              <Input
                id="npiNumber"
                type="text"
                name="npiNumber"
                value={formData.npiNumber}
                onChange={handleNumericChange}
                onBlur={handleNPIBlur}
                placeholder="NPI Number"
                maxLength={10}
                inputMode="numeric"
                disabled={isVerifyingNpi}
                className={`w-full ${errors.npiNumber ? "border-red-500" : isNpiVerified ? "border-green-500" : ""}`}
              />
              {isVerifyingNpi && <p className="mt-1 text-xs text-blue-500">Verifying NPI...</p>}
              {!isVerifyingNpi && errors.npiNumber && <p className="mt-1 text-xs text-red-500">{errors.npiNumber}</p>}
              {!isVerifyingNpi && !errors.npiNumber && isNpiVerified && formData.npiNumber && (
                <p className="mt-1 text-xs text-green-600">NPI verified successfully</p>
              )}
            </div>

            {/* Specialty */}
            <div>
              <Label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                Specialty<span className="text-red-500">*</span>
              </Label>
              <Input
                id="specialty"
                type="text"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                placeholder="Specialty"
                className={`w-full ${errors.specialty ? "border-red-500" : ""}`}
              />
              {errors.specialty && <p className="mt-1 text-xs text-red-500">{errors.specialty}</p>}
            </div>

            {/* Sub-specialty */}
            <div>
              <Label htmlFor="subSpecialty" className="block text-sm font-medium text-gray-700 mb-1">
                Sub-specialty
              </Label>
              <Input
                id="subSpecialty"
                type="text"
                name="subSpecialty"
                value={formData.subSpecialty}
                onChange={handleChange}
                placeholder="Sub-specialty"
                className="w-full"
              />
            </div>
          </div>

          {/* Row 4: States of License, License Number, Clinic/Practice Name */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* States of License */}
            <div className="relative">
              <Label htmlFor="statesOfLicense" className="block text-sm font-medium text-gray-700 mb-1">
                State(s) of License<span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.statesOfLicense} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, statesOfLicense: value }));
                  setErrors(prev => ({ ...prev, statesOfLicense: "" }));
                }}
              >
                <SelectTrigger className={`w-full ${errors.statesOfLicense ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="State(s) of License" />
                </SelectTrigger>
                <SelectContent className="z-50 max-h-60 bg-white border border-gray-200 shadow-lg">
                  {US_STATES.map(state => (
                    <SelectItem key={state} value={state} className="cursor-pointer hover:bg-gray-100">
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.statesOfLicense && <p className="mt-1 text-xs text-red-500">{errors.statesOfLicense}</p>}
            </div>

            {/* License Number */}
            <div>
              <Label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700 mb-1">
                License Number
              </Label>
              <Input
                id="licenseNumber"
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="License Number"
                className="w-full"
              />
            </div>
            <div></div>
          </div>
          </div>

          {/* Practice Information Section */}
          <div className="mt-4">
            <h3 className="text-lg font-medium text-[#1E40AF] mb-1">Practice Information</h3>
            
            {/* Row 1: Clinic/Practice Name and Address */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <Label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-1">
                  {signupType === "clinic" ? (
                    <>Clinic/Practice Name<span className="text-red-500">*</span></>
                  ) : (
                    "Clinic/Practice Name"
                  )}
                </Label>
                <Input
                  id="clinicName"
                  type="text"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  placeholder="Clinic/Practice Name"
                  className={`w-full ${errors.clinicName ? "border-red-500" : ""}`}
                />
                {errors.clinicName && <p className="mt-1 text-xs text-red-500">{errors.clinicName}</p>}
              </div>
              <div className="col-span-2">
                <Label htmlFor="practiceAddressStreet" className="block text-sm font-medium text-gray-700 mb-1">
                  {signupType === "clinic" ? (
                    <>Address<span className="text-red-500">*</span></>
                  ) : (
                    "Address"
                  )}
                </Label>
                <Input
                  id="practiceAddressStreet"
                  type="text"
                  name="street"
                  value={formData.practiceAddress.street}
                  onChange={(e) => handlePracticeAddressChange("street", e.target.value)}
                  placeholder="Street Address"
                  className={`w-full ${errors.practiceAddress?.street ? "border-red-500" : ""}`}
                />
                {errors.practiceAddress?.street && <p className="mt-1 text-xs text-red-500">{errors.practiceAddress.street}</p>}
              </div>
            </div>

            {/* Row 2: Practice Address - Street, City, State */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* Street Address */}
         

              {/* City */}
              <div>
                <Label htmlFor="practiceAddressCity" className="block text-sm font-medium text-gray-700 mb-1">
                  {signupType === "clinic" ? (
                    <>City<span className="text-red-500">*</span></>
                  ) : (
                    "City"
                  )}
                </Label>
                <Input
                  id="practiceAddressCity"
                  type="text"
                  name="city"
                  value={formData.practiceAddress.city}
                  onChange={(e) => handlePracticeAddressChange("city", e.target.value)}
                  placeholder="City"
                  className={`w-full ${errors.practiceAddress?.city ? "border-red-500" : ""}`}
                />
                {errors.practiceAddress?.city && <p className="mt-1 text-xs text-red-500">{errors.practiceAddress.city}</p>}
              </div>

              {/* State */}
              <div className="relative">
                <Label htmlFor="practiceAddressState" className="block text-sm font-medium text-gray-700 mb-1">
                  {signupType === "clinic" ? (
                    <>State<span className="text-red-500">*</span></>
                  ) : (
                    "State"
                  )}
                </Label>
                <Select 
                  value={formData.practiceAddress.state} 
                  onValueChange={(value) => handlePracticeAddressChange("state", value)}
                >
                  <SelectTrigger className={`w-full ${errors.practiceAddress?.state ? "border-red-500" : ""}`}>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent className="z-50 max-h-60 bg-white border border-gray-200 shadow-lg">
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state} className="cursor-pointer hover:bg-gray-100">
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.practiceAddress?.state && <p className="mt-1 text-xs text-red-500">{errors.practiceAddress.state}</p>}
              </div>
              <div>
                <Label htmlFor="practiceAddressZip" className="block text-sm font-medium text-gray-700 mb-1">
                  {signupType === "clinic" ? (
                    <>Zip Code<span className="text-red-500">*</span></>
                  ) : (
                    "Zip Code"
                  )}
                </Label>
                <Input
                  id="practiceAddressZip"
                  type="text"
                  name="zip"
                  value={formData.practiceAddress.zip}
                  onChange={(e) => {
                    const zipValue = e.target.value.replace(/\D/g, '').slice(0, 5);
                    handlePracticeAddressChange("zip", zipValue);
                  }}
                  onBlur={handleZipCodeBlur}
                  placeholder="Zip Code"
                  maxLength={5}
                  inputMode="numeric"
                  className={`w-full ${errors.practiceAddress?.zip ? "border-red-500" : ""}`}
                />
                {errors.practiceAddress?.zip && <p className="mt-1 text-xs text-red-500">{errors.practiceAddress.zip}</p>}
              </div>
            </div>

 
          </div>

          {/* Terms + Privacy + AI/Clinical responsibility acknowledgements* */}
          <div className="pt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => {
                  setAgreeToTerms(checked);
                  if (checked) {
                    setErrors(prev => ({ ...prev, terms: "" }));
                  }
                }}
                className="w-4 h-4 border-2 border-gray-300 rounded bg-white data-[state=checked]:bg-[#1E40AF] data-[state=checked]:border-[#1E40AF] focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 cursor-pointer"
              />
              <Label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
                I agree to{" "}
                <button type="button" className="text-[#1E40AF] hover:underline font-medium">Terms</button>
                {" + "}
                <button type="button" className="text-[#1E40AF] hover:underline font-medium">Privacy</button>
                {" + "}
                <button type="button" className="text-[#1E40AF] hover:underline font-medium">AI/Clinical responsibility acknowledgements</button><span className="text-red-500">*</span>
              </Label>
            </div>
            {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms}</p>}
          </div>

          {/* Submit Button - 30% width, Centered, Same style as Login Button */}
          <div className="flex justify-center mt-4">
            <button
              type="submit"
              disabled={isLoading || !isNpiVerified || isVerifyingNpi}
              className="w-[30%] flex items-center justify-center gap-2 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] hover:from-[#1E3A8A] hover:to-[#2563EB] text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>
      </div>

      {/* --- Heartbeat Animation (Same as Login Page) --- */}
      <div
        className="absolute left-0 right-0 w-full pointer-events-none"
        style={{ zIndex: 5, bottom: "24px" }}
      >
        <svg
          height="80"
          width="100%"
          className="heartbeat-line"
          style={{ display: "block" }}
        >
          <path
            d="M0,60 L30,60 L40,20 L50,70 L60,20 L70,70 L80,60 L100,60 L110,20 L120,70 L130,20 L140,70 L150,60 L180,60 L200,20 L220,70 L240,20 L260,70 L280,60 L300,60"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="4"
            strokeDasharray="400"
            strokeDashoffset="400"
          />
        </svg>

        {/* --- Styles --- */}
        <style>{`
          .heartbeat-line path {
            animation: heartbeat 5s ease-in-out infinite;
          }
          @keyframes heartbeat {
            0% { stroke-dashoffset: 400; }
            50% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -400; }
          }

          .animate-fadeIn {
            animation: fadeInUp 0.6s ease-out;
          }
          .animate-fadeInSlow {
            animation: fadeInBg 1.8s ease-out;
          }

          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(10px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          @keyframes fadeInBg {
            0% { opacity: 0; transform: scale(1.05); }
            100% { opacity: 0.1; transform: scale(1); }
          }

          /* Scrollbar styling for Select dropdowns */
          [data-radix-select-viewport] {
            overflow-y: auto !important;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 #f1f5f9;
          }

          [data-radix-select-viewport]::-webkit-scrollbar {
            width: 8px;
          }

          [data-radix-select-viewport]::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }

          [data-radix-select-viewport]::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
          }

          [data-radix-select-viewport]::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
      </div>
    </div>
  );
};

export default RegisterPage;

