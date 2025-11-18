class BaseCountyScraper:
    
    def search_by_apn(self, apn: str) -> dict:
        raise NotImplementedError

    def search_by_address(self, address: str) -> dict:
        raise NotImplementedError

    def search_by_owner(self, owner: str) -> dict:
            raise NotImplementedError