import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const Checkout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/cart", { replace: true });
  }, [navigate]);

  return (
    <div className="flex justify-center py-24">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );
};

export default Checkout;
