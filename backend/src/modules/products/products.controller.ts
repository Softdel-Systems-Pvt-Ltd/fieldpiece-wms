import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { RequestContext } from "../../common/auth/auth-user";
import { Ctx, Roles } from "../../common/auth/decorators";
import { ErrorCode } from "../../common/errors/error-codes";
import { ApiErrors } from "../../common/http/swagger";
import { CreateProductDto, ProductDto, ProductListQueryDto, ProductPageDto, UpdateProductDto } from "./dto";
import { ProductsService } from "./products.service";

@ApiTags("products")
@ApiBearerAuth("jwt")
@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @ApiOperation({ summary: "Product catalogue", description: "Includes the warranty term in effect today." })
  @ApiOkResponse({ type: ProductPageDto })
  @ApiErrors()
  list(@Query() query: ProductListQueryDto) {
    return this.products.list(query);
  }

  @Get(":sku")
  @ApiOperation({ summary: "Get a product by SKU" })
  @ApiOkResponse({ type: ProductDto })
  @ApiErrors({ 404: [ErrorCode.NOT_FOUND] })
  get(@Param("sku") sku: string) {
    return this.products.getBySku(sku);
  }

  @Post()
  @Roles("admin")
  @ApiOperation({ summary: "Add a product" })
  @ApiCreatedResponse({ type: ProductDto })
  @ApiErrors({ 409: [ErrorCode.CONFLICT] })
  create(@Ctx() ctx: RequestContext, @Body() body: CreateProductDto) {
    return this.products.create(ctx, body);
  }

  @Patch(":sku")
  @Roles("admin")
  @ApiOperation({ summary: "Update a product" })
  @ApiOkResponse({ type: ProductDto })
  @ApiErrors({ 404: [ErrorCode.NOT_FOUND] })
  update(@Ctx() ctx: RequestContext, @Param("sku") sku: string, @Body() body: UpdateProductDto) {
    return this.products.update(ctx, sku, body);
  }
}
