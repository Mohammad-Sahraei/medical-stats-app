import { createBrowserRouter, createRoutesFromElements, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import NotFound from "../pages/notfound/NotFound";

import ProfessorLayout from "../layouts/ProfessorLayout/ProfessorLayout";

import AddCourse from "../pages/professor/AddCourse";
import CoursesList from "../pages/professor/CourseList";
import Students from "../pages/professor/ProfessorStudents";
import Profile from "../pages/professor/ProfessorProfile";

import AddLesson from "../pages/professor/AddLesson";
import AddExam from "../pages/professor/AddExam";
import AddFile from "../pages/professor/AddFile";

import PreviewLesson from "../pages/professor/PreviewLesson";
import PreviewExam from "../pages/professor/PreviewExam";

import EditLesson from "../pages/professor/EditLesson";
import EditExam from "../pages/professor/EditExam";

import StudentLayout from "../layouts/StudentLayout/StudentLayout";

import StudentHome from "../pages/student/StudentHome";
import StudentCourses from "../pages/student/StudentCourses";
import StudentDownloads from "../pages/student/StudentDownloads";
import StudentProfile from "../pages/student/StudentProfile";
import StudentExams from "../pages/student/StudentExams";
import StudentTakeExam from "../pages/student/StudentTakeExam";
import StudentExamReview from "../pages/student/StudentExamReview";

import RequireRole from "./RequireRole";
import ThemeRouteSync from "./ThemeRouteSync";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route element={<ThemeRouteSync />}>
            {/* Auth */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} handle={{ title: "ورود", hideBack: true }} />
            <Route path="/register" element={<Register />} handle={{ title: "ثبت‌نام" }} />
            <Route path="/forgot-password" element={<ForgotPassword />} handle={{ title: "بازیابی رمز عبور" }} />

            {/* Professor Dashboard */}
            <Route
                path="/professor"
                element={
                    <RequireRole role="professor">
                        <ProfessorLayout />
                    </RequireRole>
                }
                handle={{ title: "پنل استاد" }}
            >
                <Route path="add" element={<AddCourse />} handle={{ title: "افزودن محتوا", hideBack: true }} />
                <Route path="add/lesson" element={<AddLesson />} handle={{ title: "افزودن درسنامه" }} />

                <Route path="add/exam" element={<AddExam />} handle={{ title: "افزودن آزمون" }} />
                <Route path="add/exam/:lessonId" element={<AddExam />} handle={{ title: "افزودن آزمون" }} />

                <Route path="add/file" element={<AddFile />} handle={{ title: "افزودن فایل PDF" }} />

                <Route path="courses" element={<CoursesList />} handle={{ title: "دوره‌ها و آزمون‌ها", hideBack: true }} />

                <Route path="preview-lesson/:lessonId" element={<PreviewLesson />} handle={{ title: "پیش‌نمایش درسنامه" }} />
                <Route path="preview-exam/:examId" element={<PreviewExam />} handle={{ title: "پیش‌نمایش آزمون" }} />

                <Route path="edit-lesson/:lessonId" element={<EditLesson />} handle={{ title: "ویرایش درسنامه" }} />
                <Route path="edit-exam/:examId" element={<EditExam />} handle={{ title: "ویرایش آزمون" }} />

                <Route path="students" element={<Students />} handle={{ title: "دانشجویان کلاس", hideBack: true }} />
                <Route path="profile" element={<Profile />} handle={{ title: "پروفایل استاد", hideBack: true }} />

                <Route index element={<Navigate to="add" />} />
            </Route>

            {/* Student */}
            <Route
                path="/student"
                element={
                    <RequireRole role="student">
                        <StudentLayout />
                    </RequireRole>
                }
                handle={{ title: "پنل دانشجو" }}
            >
                <Route path="home" element={<StudentHome />} handle={{ title: "صفحه اصلی", hideBack: true }} />
                <Route path="home/:lessonId" element={<StudentHome />} handle={{ title: "صفحه اصلی", hideBack: true }} />

                <Route path="courses" element={<StudentCourses />} handle={{ title: "دوره‌های من", hideBack: true }} />

                <Route path="exams" element={<StudentExams />} handle={{ title: "آزمون‌ها", hideBack: true }} />
                <Route path="exams/:examId" element={<StudentTakeExam />} handle={{ title: "شرکت در آزمون" }} />
                <Route path="exams/:examId/review" element={<StudentExamReview />} handle={{ title: "مرور پاسخ‌ها" }} />

                <Route path="downloads" element={<StudentDownloads />} handle={{ title: "دانلودها", hideBack: true }} />
                <Route path="profile" element={<StudentProfile />} handle={{ title: "پروفایل", hideBack: true }} />

                <Route index element={<Navigate to="courses" />} />
            </Route>

            {/* Unknown routes */}
            <Route path="*" element={<NotFound />} handle={{ title: "صفحه پیدا نشد", hideBack: true }} />
        </Route>
    )
);

export default router;
