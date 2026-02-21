import { VConfig } from "@wxn0brp/vql-client";
import { zhivaApiToken } from "@wxn0brp/zhiva-base-lib/front/api";

VConfig.url = "/zhiva-api/VQL";
VConfig.headers = {
    "x-zhiva-token": zhivaApiToken
}
