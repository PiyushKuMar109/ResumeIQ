import io
import PyPDF2
import docx

def extract_text_from_pdf(file_stream):
    """Extract plain text from a PDF file stream."""
    try:
        reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()
    except Exception as e:
        raise ValueError(f"Error parsing PDF file: {str(e)}")

def extract_text_from_docx(file_stream):
    """Extract plain text from a DOCX file stream."""
    try:
        # docx.Document requires a file-like object
        doc = docx.Document(file_stream)
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        return "\n".join(text).strip()
    except Exception as e:
        raise ValueError(f"Error parsing DOCX file: {str(e)}")

def extract_text(uploaded_file):
    """Determine file extension and extract text accordingly."""
    filename = uploaded_file.name.lower()
    
    # Read the file content into an in-memory byte stream
    file_content = uploaded_file.read()
    # Reset file read pointer just in case other parts of Django need it
    uploaded_file.seek(0)
    
    file_stream = io.BytesIO(file_content)

    if filename.endswith('.pdf'):
        return extract_text_from_pdf(file_stream)
    elif filename.endswith('.docx'):
        return extract_text_from_docx(file_stream)
    else:
        raise ValueError("Unsupported file format. Please upload a PDF or DOCX file.")
