import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import ProfileLayout from "../../components/profile/ProfileLayout";
import { getProfile, updateProfile } from "../../api/authApi";
import { useToast } from "../../context/ToastContext";

import "../student/StudentProfile.scss";

export default function ProfessorProfile() {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    username: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();
        setUserData({
          first_name: data.user.first_name || "",
          last_name: data.user.last_name || "",
          username: data.user.username || "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("خطا در دریافت اطلاعات پروفایل.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (key: string, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleEdit = async () => {
    if (isEditing) {
      setSaveError(null);
      try {
        await updateProfile({
          first_name: userData.first_name,
          last_name: userData.last_name,
        });
        showToast("پروفایل ذخیره شد", "success");
      } catch (err: any) {
        setSaveError(err?.response?.data?.error || "خطا در ذخیره پروفایل.");
        return;
      }
    }
    setIsEditing((prev) => !prev);
  };

  const fields = [
    { key: "first_name", label: "نام" },
    { key: "last_name", label: "نام خانوادگی" },
    { key: "username", label: "نام کاربری", readOnly: true },
  ];

  if (loading) {
    return (
      <div className="student-profile-page profile-state">
        <Loader2 className="spin" size={32} />
        <p>در حال دریافت اطلاعات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-profile-page profile-state">
        <AlertCircle size={32} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      {saveError && <p className="password-message error profile-save-error">{saveError}</p>}
      <ProfileLayout
        userTitle={`${userData.first_name} ${userData.last_name}`}
        subtitle={userData.username}
        fields={fields}
        userData={userData}
        isEditing={isEditing}
        toggleEdit={toggleEdit}
        handleChange={handleChange}
      />
    </>
  );
}
