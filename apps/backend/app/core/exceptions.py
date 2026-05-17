from fastapi import HTTPException, status


class NotFoundError(HTTPException):
    def __init__(self, resource: str = "リソース"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource}が見つかりません",
        )


class ForbiddenError(HTTPException):
    def __init__(self, detail: str = "この操作を行う権限がありません"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictError(HTTPException):
    def __init__(self, detail: str = "リソースが既に存在します"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail)


class RateLimitError(HTTPException):
    def __init__(self, detail: str = "リクエスト上限に達しました"):
        super().__init__(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)


class AIServiceError(HTTPException):
    def __init__(self, detail: str = "AI サービスでエラーが発生しました"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail,
        )
