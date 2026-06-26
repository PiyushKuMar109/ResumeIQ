import os
import boto3
from botocore.exceptions import BotoCoreError, ClientError

AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.getenv('AWS_STORAGE_BUCKET_NAME')
AWS_S3_REGION_NAME = os.getenv('AWS_S3_REGION_NAME', 'ap-south-1')
AWS_S3_CUSTOM_DOMAIN = os.getenv('AWS_S3_CUSTOM_DOMAIN')


def is_s3_configured():
    return bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME)


def get_s3_client():
    if not is_s3_configured():
        return None
    return boto3.client(
        's3',
        region_name=AWS_S3_REGION_NAME,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    )


def upload_file(file_path: str, object_name: str) -> str:
    client = get_s3_client()
    if not client:
        return ''
    try:
        client.upload_file(file_path, AWS_STORAGE_BUCKET_NAME, object_name)
        if AWS_S3_CUSTOM_DOMAIN:
            return f'https://{AWS_S3_CUSTOM_DOMAIN}/{object_name}'
        return f'https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/{object_name}'
    except (BotoCoreError, ClientError):
        return ''


def upload_fileobj(file_obj, object_name: str) -> str:
    client = get_s3_client()
    if not client:
        return ''
    try:
        client.upload_fileobj(file_obj, AWS_STORAGE_BUCKET_NAME, object_name)
        if AWS_S3_CUSTOM_DOMAIN:
            return f'https://{AWS_S3_CUSTOM_DOMAIN}/{object_name}'
        return f'https://{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com/{object_name}'
    except (BotoCoreError, ClientError):
        return ''
