from app import create_app
from app.models import db, User, Student, Professor, Lesson, Section, Exam, Question, ExamSubmission, SectionProgress

def seed_database():
    app = create_app()
    with app.app_context():
        print("Seeding database with ultra-detailed mock data...")
        
        # Ensure users exist (from init_db.py)
        admin = User.query.filter_by(username='admin').first()
        professor = User.query.filter_by(username='professor').first()
        student = User.query.filter_by(username='student').first()
        
        if not professor:
            professor = Professor(
                username='professor',
                first_name='John',
                last_name='Smith',
                role='professor'
            )
            professor.set_password('prof123')
            db.session.add(professor)
            
        if not student:
            student = Student(
                username='student',
                first_name='Jane',
                last_name='Doe',
                student_id='STU2024001',
                role='student'
            )
            student.set_password('student123')
            db.session.add(student)
            
        db.session.commit()
        
        # ----------------------------------------------------
        # Lesson 1: Introduction to Python
        # ----------------------------------------------------
        lesson1 = Lesson.query.filter_by(title="مقدمه‌ای بر برنامه‌نویسی پایتون").first()
        if lesson1:
            db.session.delete(lesson1)
            db.session.commit()
            
        lesson1 = Lesson(
            title="مقدمه‌ای بر برنامه‌نویسی پایتون",
            professor_id=professor.id
        )
        db.session.add(lesson1)
        db.session.commit()
        print("- Created Lesson: Introduction to Python")
        
        # Sections for Lesson 1
        sec1 = Section(
            lesson_id=lesson1.id,
            title="۱. متغیرها و انواع داده‌ها در پایتون",
            body_content="""
            <div style="direction: rtl; text-align: right; font-family: Tahoma, sans-serif;">
                <p>در پایتون متغیرها مکان‌هایی برای ذخیره‌سازی داده‌ها هستند. پایتون به صورت پویا نوع‌گذاری می‌شود (Dynamically Typed)؛ به این معنی که نیازی به تعریف صریح نوع متغیر ندارید. نوع متغیر بر اساس مقدار انتساب داده شده به آن تعیین می‌شود.</p>
                
                <h3 style="color: #2c3e50;">انواع داده‌های عددی:</h3>
                <ul>
                    <li><b>Integer (int):</b> اعداد صحیح مثبت یا منفی بدون ممیز. مانند: <code>x = 42</code></li>
                    <li><b>Float:</b> اعداد ممیز شناور (اعشاری). مانند: <code>y = 3.14</code></li>
                    <li><b>Complex:</b> اعداد مختلط. مانند: <code>z = 2 + 3j</code></li>
                </ul>
                
                <h3 style="color: #2c3e50;">انواع داده‌های متوالی:</h3>
                <ul>
                    <li><b>String (str):</b> رشته‌ای از کاراکترها درون تک‌کوت یا دبل‌کوت. مانند: <code>name = 'MSH Education'</code></li>
                    <li><b>List (list):</b> مجموعه‌ای منظم و قابل تغییر از اشیاء. مانند: <code>fruits = ['apple', 'banana']</code></li>
                    <li><b>Tuple (تاپل):</b> مجموعه‌ای منظم و غیرقابل تغییر. مانند: <code>coordinates = (10, 20)</code></li>
                </ul>
                
                <pre style="background: #f8f9fa; border-left: 4px solid #007bff; padding: 10px; direction: ltr; text-align: left;"><code>x = 5
y = "Hello World"
print(type(x))  # output: &lt;class 'int'&gt;
print(type(y))  # output: &lt;class 'str'&gt;</code></pre>
            </div>
            """,
            order_index=0
        )
        sec2 = Section(
            lesson_id=lesson1.id,
            title="۲. دستورات شرطی و حلقه‌ها",
            body_content="""
            <div style="direction: rtl; text-align: right; font-family: Tahoma, sans-serif;">
                <p>حلقه‌ها و دستورات شرطی ساختار کنترلی برنامه را تشکیل می‌دهند. پایتون از فواصل خالی (Indentation) برای مشخص کردن بلاک‌های کد استفاده می‌کند. رعایت دندانه‌گذاری در پایتون اجباری است.</p>
                
                <h3 style="color: #2c3e50;">ساختار شرطی if-elif-else:</h3>
                <p>برای تصمیم‌گیری در کد بر اساس درستی یا نادرستی یک شرط استفاده می‌شود:</p>
                
                <pre style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 10px; direction: ltr; text-align: left;"><code>score = 85
if score >= 90:
    print("Grade: A")
elif score >= 80:
    print("Grade: B")
else:
    print("Grade: C")</code></pre>
                
                <h3 style="color: #2c3e50;">حلقه‌های تکرار:</h3>
                <ul>
                    <li><b>For Loop:</b> برای پیمایش روی اعضای یک شیء متوالی (مانند لیست یا تاپل).</li>
                    <li><b>While Loop:</b> تا زمانی که شرط حلقه درست باشد، تکرار می‌شود.</li>
                </ul>
                
                <pre style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 10px; direction: ltr; text-align: left;"><code>for i in range(3):
    print(f"Iteration {i}")</code></pre>
            </div>
            """,
            order_index=1
        )
        db.session.add(sec1)
        db.session.add(sec2)
        db.session.commit()
        print("  - Created sections for Lesson 1")
        
        # Exam for Lesson 1
        exam1 = Exam(
            title="کوئیز جامع پایتون مقدماتی",
            lesson_id=lesson1.id,
            professor_id=professor.id
        )
        db.session.add(exam1)
        db.session.commit()
        print("- Created Exam: Python Basics Comprehensive Quiz")
        
        # Questions for Exam 1 (4 questions)
        q1 = Question(
            exam_id=exam1.id,
            question_text="<p>خروجی دستور <code>print(5 // 2)</code> در پایتون چیست؟</p>",
            option_a="2.5",
            option_b="2",
            option_c="3",
            option_d="هیچکدام",
            correct_option="B",
            order_index=0
        )
        q2 = Question(
            exam_id=exam1.id,
            question_text="<p>کدام یک از ساختارهای داده زیر در پایتون <b>غیرقابل تغییر (Immutable)</b> است؟</p>",
            option_a="List (لیست)",
            option_b="Dictionary (دیکشنری)",
            option_c="Tuple (تاپل)",
            option_d="Set (مجموعه)",
            correct_option="C",
            order_index=1
        )
        q3 = Question(
            exam_id=exam1.id,
            question_text="<p>خروجی دستور <code>print(bool([]))</code> در مفسر پایتون چیست؟</p>",
            option_a="True",
            option_b="False",
            option_c="None",
            option_d="بروز خطای Syntax",
            correct_option="B",
            order_index=2
        )
        q4 = Question(
            exam_id=exam1.id,
            question_text="<p>کدام گزینه شناسه یا نام متغیر <b>معتبر</b> در زبان پایتون است؟</p>",
            option_a="<code>2class</code>",
            option_b="<code>my-variable</code>",
            option_c="<code>_my_var</code>",
            option_d="<code>import</code>",
            correct_option="C",
            order_index=3
        )
        db.session.add(q1)
        db.session.add(q2)
        db.session.add(q3)
        db.session.add(q4)
        db.session.commit()
        print("  - Added 4 detailed questions for Exam 1")
        
        # ----------------------------------------------------
        # Lesson 2: Object-Oriented Programming (OOP)
        # ----------------------------------------------------
        lesson2 = Lesson.query.filter_by(title="برنامه‌نویسی شیءگرا در پایتون").first()
        if lesson2:
            db.session.delete(lesson2)
            db.session.commit()
            
        lesson2 = Lesson(
            title="برنامه‌نویسی شیءگرا در پایتون",
            professor_id=professor.id
        )
        db.session.add(lesson2)
        db.session.commit()
        print("- Created Lesson: Object-Oriented Programming (OOP)")
        
        # Sections for Lesson 2
        sec3 = Section(
            lesson_id=lesson2.id,
            title="۱. کلاس‌ها و اشیاء در پایتون",
            body_content="""
            <div style="direction: rtl; text-align: right; font-family: Tahoma, sans-serif;">
                <p>شیءگرایی پارادایمی برای مدل‌سازی رفتارهای دنیای واقعی در کد است. کلاس به عنوان یک نقشه (Blueprint) و شیء به عنوان نمونه عینی از آن تعریف می‌شود.</p>
                
                <h3 style="color: #2c3e50;">تعریف سازنده کلاس (__init__):</h3>
                <p>متد <code>__init__</code> سازنده کلاس است و هر زمان که نمونه جدیدی از کلاس بسازیم، به صورت خودکار فراخوانی می‌شود تا مقادیر اولیه را مقداردهی کند.</p>
                
                <pre style="background: #f8f9fa; border-left: 4px solid #17a2b8; padding: 10px; direction: ltr; text-align: left;"><code>class Car:
    def __init__(self, brand, year):
        self.brand = brand
        self.year = year

my_car = Car("Tesla", 2024)
print(my_car.brand)  # output: Tesla</code></pre>
            </div>
            """,
            order_index=0
        )
        sec4 = Section(
            lesson_id=lesson2.id,
            title="۲. ارث‌بری (Inheritance) و چندریختی",
            body_content="""
            <div style="direction: rtl; text-align: right; font-family: Tahoma, sans-serif;">
                <p>ارث‌بری به ما اجازه می‌دهد کلاس جدیدی تعریف کنیم که تمام متدها و ویژگی‌های کلاس والد (Parent class) را به ارث می‌برد و کدهای تکراری را کاهش می‌دهد.</p>
                
                <h3 style="color: #2c3e50;">تعریف کلاس فرزند در پایتون:</h3>
                <p>نام کلاس والد را در پرانتز جلوی نام کلاس فرزند قرار می‌دهیم:</p>
                
                <pre style="background: #f8f9fa; border-left: 4px solid #17a2b8; padding: 10px; direction: ltr; text-align: left;"><code>class Vehicle:
    def start(self):
        print("Vehicle started")

class Motorcycle(Vehicle):
    pass

my_bike = Motorcycle()
my_bike.start()  # output: Vehicle started</code></pre>
            </div>
            """,
            order_index=1
        )
        db.session.add(sec3)
        db.session.add(sec4)
        db.session.commit()
        print("  - Created sections for Lesson 2")
        
        # Exam for Lesson 2
        exam2 = Exam(
            title="آزمون شیءگرایی (OOP) پایتون",
            lesson_id=lesson2.id,
            professor_id=professor.id
        )
        db.session.add(exam2)
        db.session.commit()
        print("- Created Exam: Python OOP Comprehensive Exam")
        
        # Questions for Exam 2 (3 questions)
        q5 = Question(
            exam_id=exam2.id,
            question_text="<p>کدام متد جادویی (Magic Method) به عنوان <b>سازنده کلاس (Constructor)</b> در پایتون عمل می‌کند؟</p>",
            option_a="<code>__new__</code>",
            option_b="<code>__init__</code>",
            option_c="<code>__del__</code>",
            option_d="<code>__str__</code>",
            correct_option="B",
            order_index=0
        )
        q6 = Question(
            exam_id=exam2.id,
            question_text="<p>کدام گزینه تعریف صحیح ارث‌بری کلاس <code>Student</code> از کلاس <code>Person</code> است؟</p>",
            option_a="<code>class Student extends Person</code>",
            option_b="<code>class Student implements Person</code>",
            option_c="<code>class Student(Person):</code>",
            option_d="<code>class Student: Person</code>",
            correct_option="C",
            order_index=1
        )
        q7 = Question(
            exam_id=exam2.id,
            question_text="<p>در کلاس‌های شیءگرا، متغیر <code>self</code> به چه چیزی اشاره می‌کند؟</p>",
            option_a="به خود کلاس والد",
            option_b="به نمونه عینی (Instance) جاری از کلاس",
            option_c="به ماژول اصلی برنامه",
            option_d="یک پارامتر اختیاری است که می‌توان حذف کرد",
            correct_option="B",
            order_index=2
        )
        db.session.add(q5)
        db.session.add(q6)
        db.session.add(q7)
        db.session.commit()
        print("  - Added 3 detailed questions for Exam 2")
        
        # ----------------------------------------------------
        # Lesson 3: Error Handling & File Operations
        # ----------------------------------------------------
        lesson3 = Lesson.query.filter_by(title="مدیریت خطا و کار با فایل‌ها در پایتون").first()
        if lesson3:
            db.session.delete(lesson3)
            db.session.commit()
            
        lesson3 = Lesson(
            title="مدیریت خطا و کار با فایل‌ها در پایتون",
            professor_id=professor.id
        )
        db.session.add(lesson3)
        db.session.commit()
        print("- Created Lesson: Error Handling & File Operations")
        
        # Sections for Lesson 3
        sec5 = Section(
            lesson_id=lesson3.id,
            title="۱. مدیریت استثناها با try-except",
            body_content="""
            <div style="direction: rtl; text-align: right; font-family: Tahoma, sans-serif;">
                <p>خطاها در زمان اجرا به عنوان استثنا (Exception) شناخته می‌شوند. برای جلوگیری از متوقف شدن ناگهانی برنامه، از ساختار <code>try-except</code> استفاده می‌کنیم.</p>
                
                <h3 style="color: #2c3e50;">بلاک‌های finally و else:</h3>
                <ul>
                    <li><b>Else:</b> کدهای درون این بلاک فقط زمانی اجرا می‌شوند که هیچ خطایی در بلاک try رخ نداده باشد.</li>
                    <li><b>Finally:</b> کدهای این بلاک در هر شرایطی (چه خطا رخ دهد چه رخ ندهد) حتماً اجرا می‌شوند (مانند بستن فایل یا اتصالات دیتابیس).</li>
                </ul>
                
                <pre style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 10px; direction: ltr; text-align: left;"><code>try:
    num = 10 / 0
except ZeroDivisionError:
    print("Cannot divide by zero!")
finally:
    print("This will always run.")</code></pre>
            </div>
            """,
            order_index=0
        )
        sec6 = Section(
            lesson_id=lesson3.id,
            title="۲. مدیریت و خواندن فایل‌ها با عبارت with",
            body_content="""
            <div style="direction: rtl; text-align: right; font-family: Tahoma, sans-serif;">
                <p>پایتون توابع داخلی قدرتمندی برای کار با فایل‌ها ارائه می‌دهد. بهترین روش کار با فایل‌ها استفاده از عبارت <code>with</code> است که تضمین می‌کند فایل پس از خروج از بلاک حتماً بسته می‌شود.</p>
                
                <pre style="background: #f8f9fa; border-left: 4px solid #ffc107; padding: 10px; direction: ltr; text-align: left;"><code># Writing to a file
with open("test.txt", "w", encoding="utf-8") as file:
    file.write("Hello MSH Backend!")

# Reading from a file
with open("test.txt", "r", encoding="utf-8") as file:
    content = file.read()
    print(content)</code></pre>
            </div>
            """,
            order_index=1
        )
        db.session.add(sec5)
        db.session.add(sec6)
        db.session.commit()
        print("  - Created sections for Lesson 3")
        
        # Exam for Lesson 3
        exam3 = Exam(
            title="آزمون مدیریت خطا و فایل پایتون",
            lesson_id=lesson3.id,
            professor_id=professor.id
        )
        db.session.add(exam3)
        db.session.commit()
        print("- Created Exam: Error Handling & File Operations Exam")
        
        # Questions for Exam 3 (3 questions)
        q8 = Question(
            exam_id=exam3.id,
            question_text="<p>کدام کلمه کلیدی در ساختار مدیریت استثنا، تحت <b>هر شرایطی</b> (چه خطا رخ دهد یا ندهد) حتماً اجرا می‌شود؟</p>",
            option_a="<code>else</code>",
            option_b="<code>finally</code>",
            option_c="<code>except</code>",
            option_d="<code>raise</code>",
            correct_option="B",
            order_index=0
        )
        q9 = Question(
            exam_id=exam3.id,
            question_text="<p>مزیت اصلی استفاده از عبارت <code>with</code> هنگام باز کردن یک فایل در پایتون چیست؟</p>",
            option_a="فایل با سرعت بسیار بالاتری خوانده می‌شود",
            option_b="فایل پس از خروج از بلاک با هر دلیلی به صورت خودکار بسته می‌شود",
            option_c="فایل را به صورت رمزنگاری شده ذخیره می‌کند",
            option_d="هیچ تفاوتی با تابع open معمولی ندارد",
            correct_option="B",
            order_index=1
        )
        q10 = Question(
            exam_id=exam3.id,
            question_text="<p>کدام استثنا (Exception) زمانی پرتاب می‌شود که تلاش کنیم تقسیم بر صفر انجام دهیم؟</p>",
            option_a="<code>ValueError</code>",
            option_b="<code>TypeError</code>",
            option_c="<code>ZeroDivisionError</code>",
            option_d="<code>FileNotFoundError</code>",
            correct_option="C",
            order_index=2
        )
        db.session.add(q8)
        db.session.add(q9)
        db.session.add(q10)
        db.session.commit()
        print("  - Added 3 detailed questions for Exam 3")
        
        # ----------------------------------------------------
        # Seed progress data for default student
        # ----------------------------------------------------
        # Delete any existing progress for clean seeding
        db.session.query(SectionProgress).delete()
        
        progress1 = SectionProgress(student_id=student.id, section_id=sec1.id)
        progress2 = SectionProgress(student_id=student.id, section_id=sec3.id)
        db.session.add(progress1)
        db.session.add(progress2)
        db.session.commit()
        print("  - Seeded initial student section progress")
        
        print("\nDatabase successfully populated with highly detailed, premium mock data!")

if __name__ == '__main__':
    seed_database()
