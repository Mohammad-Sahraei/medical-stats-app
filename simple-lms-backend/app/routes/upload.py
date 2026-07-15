import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from app.routes.auth import role_required
from werkzeug.utils import secure_filename
from PIL import Image

upload_bp = Blueprint('upload', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@upload_bp.route('', methods=['POST'])
@role_required(['professor', 'admin'])
def upload_file():
    """
    Upload an Image file
    ---
    tags:
      - Upload
    security: [{Bearer: []}]
    consumes:
      - multipart/form-data
    parameters:
      - name: image
        in: formData
        type: file
        required: true
        description: The image file to upload
    responses:
      201:
        description: File successfully uploaded
      400:
        description: Bad request (No file or wrong file type)
      403:
        description: Only professors or admins can upload
    """
    if 'image' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400
        
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and allowed_file(file.filename):
        # Generate safe, unique filename
        filename = secure_filename(file.filename)
        extension = filename.rsplit('.', 1)[1].lower()
        unique_filename = f"{uuid.uuid4().hex}.{extension}"
        
        # Ensure upload folder exists
        upload_folder = current_app.config['UPLOAD_FOLDER']
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder, exist_ok=True)
            
        file_path = os.path.join(upload_folder, unique_filename)
        
        # Open the image, convert to standard format (RGB) if necessary, and save as WebP
        try:
            img = Image.open(file)
            new_unique_filename = f"{uuid.uuid4().hex}.webp"
            file_path = os.path.join(upload_folder, new_unique_filename)
            
            img.save(file_path, "webp", optimize=True, quality=80)
        except Exception as e:
            return jsonify({'error': f'Could not process image: {str(e)}'}), 500
        
        # This returns a URL path relative to the domain (e.g. /api/upload/images/<filename>)
        image_url = f"/api/upload/images/{new_unique_filename}"
        
        return jsonify({'url': image_url, 'message': 'File successfully uploaded'}), 201
        
    return jsonify({'error': 'File type not allowed'}), 400


@upload_bp.route('/images/<filename>')
def serve_image(filename):
    """
    Serve uploaded images publicly
    ---
    tags:
      - Upload
    parameters:
      - name: filename
        in: path
        type: string
        required: true
        description: The unique auto-generated name of the uploaded image file.
    produces:
      - image/webp
      - image/png
      - image/jpeg
      - image/gif
    responses:
      200:
        description: Returns the raw binary image stream.
      404:
        description: Image file not found.
    """
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
