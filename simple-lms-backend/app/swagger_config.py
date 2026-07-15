swagger_config = {
    'headers': [],
    'specs': [
        {
            'endpoint': 'apispec',
            'route': '/apispec.json',
            'rule_filter': lambda rule: True,
            'model_filter': lambda tag: True
        }
    ],
    'static_url_path': '/flasgger_static',
    'swagger_ui': True,
    'specs_route': '/docs/'
}

swagger_template = {
    'swagger': '2.0',
    'info': {
        'title': 'School & Exam Management API',
        'description': 'A beautiful, premium, and fully featured Flask API supporting school courses, multimedia content uploads, user registration, and interactive auto-graded student multiple-choice exams.',
        'version': '1.1.0',
        'contact': {
            'name': 'API Administrator Support',
            'email': 'admin@msh-education.com'
        }
    },
    'securityDefinitions': {
        'Bearer': {
            'type': 'oauth2',
            'flow': 'password',
            'tokenUrl': '/api/auth/login',
            'description': 'Automatic login: click Authorize, enter your username and password, then click Login to authenticate automatically.'
        }
    },
    'tags': [
        {
            'name': 'Authentication',
            'description': 'Endpoints handling registration, login, token refresh, and user profiles.'
        },
        {
            'name': 'Admin',
            'description': 'Administrative dashboards and system statistics access.'
        },
        {
            'name': 'Professor',
            'description': 'Actions reserved for academic staffs and educators.'
        },
        {
            'name': 'Student',
            'description': 'End-user student metrics, grades, and profile queries.'
        },
        {
            'name': 'Lessons',
            'description': 'Course content structure, lessons, and body sections CRUD.'
        },
        {
            'name': 'Upload',
            'description': 'Image upload and conversion helper methods for multimedia integration.'
        },
        {
            'name': 'Exams',
            'description': 'Quiz and test building, question creation, and interactive student submissions & grading.'
        },
        {
            'name': 'Progress',
            'description': 'Endpoints for tracking student learning progress and marking lesson sections as completed.'
        }
    ]
}
