import React from "react"; // Make sure to import React (necessary for JSX)

interface FormGroupProps {
  id: string;
  label: string;
  [key: string]: unknown;
}

const FormGroup: React.FC<FormGroupProps> = ({ id, label, ...inputProps }) => {
  return (
    <div className="form__group ma-bt-md">
      <label className="form__label" htmlFor={id}>
        {label}
      </label>
      <input className="form__input" id={id} {...inputProps} />
    </div>
  );
};

export default FormGroup;
