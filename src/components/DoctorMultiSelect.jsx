import React from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedDoctors } from "../redux/doctor-slice"; // adjust import path if needed
import { components } from "react-select";

// Custom value container to override the default tag display
const CustomValueContainer = ({ children, ...props }) => {
  const selected = props.getValue();
  const allDoctors = props.selectProps.options.filter(opt => opt.value !== "__all__");

  let placeholderText = "Select";
  if (selected.length === allDoctors.length) {
    placeholderText = "Selected all";
  } else if (selected.length > 0) {
    placeholderText = `Selected ${selected.length}`;
  }

  return (
    <components.ValueContainer {...props}>
      <div className="px-1 text-gray-600">{placeholderText}</div>
      <div className="sr-only">{children}</div> {/* ✅ This is what makes the whole box interactive */}
    </components.ValueContainer>
  );
};

const DoctorMultiSelect = ({ className = "" }) => {
  const dispatch = useDispatch();

  const allDoctors = useSelector((state) => state.doctors.doctors); // [{ value, label }]
  const selectedDoctorValues = useSelector((state) => state.doctors.selectedDoctors); // [value1, value2]

  const isAllSelected = selectedDoctorValues.length === allDoctors.length;

  const customOptions = [
    {
      value: "__all__",
      label: isAllSelected ? "Unselect All" : "Select All",
    },
    ...allDoctors,
  ];

  const selectedOptions = allDoctors.filter((doc) =>
    selectedDoctorValues.includes(doc.value)
  );

  const toggleAllDoctors = () => {
    if (isAllSelected) {
      dispatch(setSelectedDoctors([]));
    } else {
      dispatch(setSelectedDoctors(allDoctors.map((d) => d.value)));
    }
  };

  const handleChange = (selectedOptions) => {
    if (!selectedOptions) {
      dispatch(setSelectedDoctors([]));
      return;
    }

    const hasSelectAll = selectedOptions.some((opt) => opt.value === "__all__");
    if (hasSelectAll) {
      toggleAllDoctors();
      return;
    }

    dispatch(setSelectedDoctors(selectedOptions.map((opt) => opt.value)));
  };

  const CustomOption = (props) => {
    const isSelected =
      props.isSelected ||
      (props.data.value === "__all__" && isAllSelected);

    return (
      <div
        {...props.innerProps}
        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={isSelected}
          readOnly
          className="form-checkbox text-blue-600 mr-2"
        />
        <span>{props.label}</span>
      </div>
    );
  };

  const customStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: "0.375rem", // Tailwind rounded-md
      borderColor: "#d1d5db",
      minHeight: "2.5rem",
      width: "300px", // Wider input
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : base.boxShadow,
      cursor: "pointer",
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      width: "300px", // Match width
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? "#f3f4f6" : "white",
      color: "black",
      cursor: "pointer",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
    valueContainer: (base) => ({
      ...base,
      paddingLeft: "0.75rem",
      paddingRight: "0.75rem",
      whiteSpace: "nowrap",
    }),
  };

  const DropdownIndicator = (props) => {
    const {
      selectProps: { menuIsOpen },
    } = props;

    return (
      <components.DropdownIndicator {...props}>
        <span className="text-gray-500">
          {menuIsOpen ? "▲" : "▼"}
        </span>
      </components.DropdownIndicator>
    );
  };

  return (
    <div className={`w-full ${className}`}>
      <Select
        isMulti
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        options={customOptions}
        value={selectedOptions}
        onChange={handleChange}
        components={{
          Option: CustomOption,
          ValueContainer: CustomValueContainer,
          DropdownIndicator,
          MultiValue: () => null,     // ✅ hide doctor name tags
          SingleValue: () => null,    // ✅ hide duplicate "Select"
        }}
        styles={{
          ...customStyles,
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
            position: "absolute",
          }),
        }}
        className="react-select-container"
        classNamePrefix="react-select"
        isSearchable={false}
        menuPortalTarget={document.body}
      />
    </div>
  );
};

export default DoctorMultiSelect;