import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, AlertCircle } from "lucide-react";
import CourseCard from "../../components/course/CourseCard";
import { getStudentProgress } from "../../api/lessonsApi";
import "./StudentCourses.scss";

interface CourseProgress {
    lesson_id: number;
    lesson_title: string;
    total_sections: number;
    completed_sections_count: number;
    progress_percentage: number;
}

export default function StudentCourses() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [courses, setCourses] = useState<CourseProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await getStudentProgress();
                setCourses(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Failed to load courses:", err);
                setError("خطا در دریافت لیست دوره‌ها.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filteredCourses = useMemo(() => {
        return courses.filter((course) =>
            course.lesson_title.toLowerCase().includes(search.toLowerCase()),
        );
    }, [courses, search]);

    return (
        <div className="student-courses-page">
            <div className="student-courses-header">
                <div className="courses-search">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="جستجوی دوره..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading && (
                <div className="courses-state">
                    <Loader2 className="spin" size={32} />
                    <p>در حال دریافت دوره‌ها...</p>
                </div>
            )}

            {!loading && error && (
                <div className="courses-state">
                    <AlertCircle size={32} />
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && filteredCourses.length === 0 && (
                <div className="courses-state">
                    <p>هنوز دوره‌ای برای شما ثبت نشده است.</p>
                </div>
            )}

            {!loading && !error && filteredCourses.length > 0 && (
                <div className="student-courses-grid">
                    {filteredCourses.map((course) => (
                        <CourseCard
                            key={course.lesson_id}
                            title={course.lesson_title}
                            description={`${course.completed_sections_count} از ${course.total_sections} بخش تکمیل‌شده`}
                            progress={course.progress_percentage}
                            onClick={() => navigate(`/student/home/${course.lesson_id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
